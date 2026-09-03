import * as vscode from "vscode";

interface VerifiedEntitlement {
    verifiedAt: string;
    instanceId?: string;
}

const ENTITLEMENT_KEY = "gitmind.pro.verifiedEntitlement";

/**
 * Stores the result of a server-verified GitMind Pro activation outside writable
 * workspace settings. This is deliberately separate from LegacyEntitlementService:
 * inherited Lemon Squeezy customers have a distinct, documented local entitlement.
 */
export class VerifiedEntitlementService {
    private static instance: VerifiedEntitlementService;
    private context: vscode.ExtensionContext | undefined;
    private entitlement: VerifiedEntitlement | undefined;

    private constructor() { }

    public static getInstance(): VerifiedEntitlementService {
        if (!VerifiedEntitlementService.instance) {
            VerifiedEntitlementService.instance = new VerifiedEntitlementService();
        }
        return VerifiedEntitlementService.instance;
    }

    public initialize(context: vscode.ExtensionContext): void {
        this.context = context;
        this.entitlement = context.globalState.get<VerifiedEntitlement>(ENTITLEMENT_KEY);
    }

    public hasActiveEntitlement(): boolean {
        return Boolean(this.entitlement && Number.isFinite(Date.parse(this.entitlement.verifiedAt)));
    }

    public async grant(instanceId?: string): Promise<void> {
        if (!this.context) {
            throw new Error("Verified entitlement storage is not initialized.");
        }
        this.entitlement = { verifiedAt: new Date().toISOString(), ...(instanceId ? { instanceId } : {}) };
        await this.context.globalState.update(ENTITLEMENT_KEY, this.entitlement);
    }

    public async revoke(): Promise<void> {
        this.entitlement = undefined;
        await this.context?.globalState.update(ENTITLEMENT_KEY, undefined);
    }
}
