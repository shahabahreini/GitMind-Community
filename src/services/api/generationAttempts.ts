import * as vscode from "vscode";
import { ProviderApiError } from "./recovery";

/** One operation's generation attempts. Metadata lookups are deliberately excluded. */
export class GenerationAttempts {
    private approved = 0;
    public actual = 0;
    public planned = 1;

    constructor(private readonly signal?: AbortSignal, private readonly changed?: () => void) {}

    async approveBatch(estimate: number): Promise<void> {
        this.signal?.throwIfAborted();
        this.planned = Math.max(estimate, this.actual + 1);
        this.changed?.();
        const initial = await vscode.window.showWarningMessage(
            `This diff needs about ${this.planned} generation calls, including the final message. Allow up to 5 calls for this generation?`,
            { modal: true }, "Allow up to 5 calls",
        );
        if (initial !== "Allow up to 5 calls") { throw this.cancelled(); }
        this.approved = 5;
        if (this.planned > 5) { await this.approveHigher(this.planned); }
    }

    private async approveHigher(total: number): Promise<void> {
        this.signal?.throwIfAborted();
        const choice = `Allow up to ${total} calls`;
        const answer = await vscode.window.showWarningMessage(
            `The planned generation needs up to ${total} calls in total. Approve this higher limit?`,
            { modal: true }, choice,
        );
        if (answer !== choice) { throw this.cancelled(); }
        this.approved = total;
        this.planned = Math.max(this.planned, total);
        this.changed?.();
    }

    async beforeAttempt(batched: boolean): Promise<void> {
        this.signal?.throwIfAborted();
        if (batched && this.actual >= this.approved) { await this.approveHigher(this.actual + 1); }
        this.signal?.throwIfAborted();
        this.actual++;
        this.changed?.();
    }

    private cancelled(): ProviderApiError {
        return new ProviderApiError("Large-diff generation was cancelled before further requests.", { category: "cancelled" });
    }
}
