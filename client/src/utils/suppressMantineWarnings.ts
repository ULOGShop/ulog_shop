const originalError = console.error.bind(console);

console.error = (...args: any[]) => {
    const fullMessage = args.map(arg => String(arg)).join(" ");
    if (
        fullMessage.includes("Unsupported style property") &&
        fullMessage.includes("data-")
    ) {
        return;
    }
    originalError(...args);
};