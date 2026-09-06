export abstract class BridgeError extends Error {
    abstract readonly httpStatus: number;
    abstract readonly code: string;

    constructor(message: string, options?: { cause?: unknown }) {
        super(message, options);
        this.name = new.target.name;
    }

    toJSON(): { error: string; message: string } {
        return { error: this.code, message: this.message };
    }
}
