import { CommitMessage } from "../config/types";

export function formatCommitMessage(message: CommitMessage): string {
    return `${message.summary}\n\n${message.description}`;
}