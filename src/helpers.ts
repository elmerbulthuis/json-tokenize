import { JsonTokenizerError } from "./error";

export async function* readChars(chunks: AsyncIterable<string> | Iterable<string>) {
    for await (const chunk of chunks) {
        yield* chunk;
    }
}

export function isLowerAlpha(char: string) {
    return char >= "a" && char <= "z";
}

export function isWhitespace(char: string) {
    return (
        char === "\u0020" || // space
        char === "\u000A" || // line feed
        char === "\u000D" || // carriage return
        char === "\u0009" // horizontal tab
    );
}

export function isNumeric(char: string) {
    return char >= "0" && char <= "9";
}

export function assertDone(
    result: IteratorResult<string, void>,
): asserts result is IteratorYieldResult<string> {
    assert(result.done ?? false, "Unexpected end of input");
}

export function assertExpected(
    actual: string,
    expected: string,
) {
    if (actual !== expected) {
        throwUnexpected(actual);
    }
}

export function throwUnexpected(value: string): never {
    throw new JsonTokenizerError(`Unexpected ${value}`);
}

export function assert(
    condition: boolean,
    message: string,
): asserts condition {
    if (condition) throw new JsonTokenizerError(message);
}
