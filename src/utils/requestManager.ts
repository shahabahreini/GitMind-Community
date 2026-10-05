export class RequestManager {
    private static instance: RequestManager;
    private currentController: AbortController | null = null;

    private constructor() { }

    public static getInstance(): RequestManager {
        if (!RequestManager.instance) {
            RequestManager.instance = new RequestManager();
        }
        return RequestManager.instance;
    }

    public getController(): AbortController {
        // Create new controller
        this.currentController = new AbortController();
        return this.currentController;
    }

    public abortCurrentRequest(): void {
        if (this.currentController) {
            this.currentController.abort();
            this.currentController = null;
        }
    }

    public isRequestActive(): boolean {
        return this.currentController !== null;
    }
}
