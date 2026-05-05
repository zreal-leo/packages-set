declare global {
    interface Console {
        temp(arg: unknown): void;
    }
}

console.temp = (arg: unknown) => {
    console.log('[temp]', arg);
};

export {};
