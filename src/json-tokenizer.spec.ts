import * as test from "tape-promise/tape";
import { jsonTokenizer, Token, TokenType } from "./json-tokenizer";

test("object", async t => {
    t.deepEqual(
        await toTokenList("{}{}"),
        [
            { type: TokenType.ObjectOpen, value: "{" },
            { type: TokenType.ObjectClose, value: "}" },
            { type: TokenType.ObjectOpen, value: "{" },
            { type: TokenType.ObjectClose, value: "}" },
        ],
    );

});

test("array", async t => {
    t.deepEqual(
        await toTokenList("[][]"),
        [
            { type: TokenType.ArrayOpen, value: "[" },
            { type: TokenType.ArrayClose, value: "]" },
            { type: TokenType.ArrayOpen, value: "[" },
            { type: TokenType.ArrayClose, value: "]" },
        ],
    );

});

test("nested array", async t => {
    t.deepEqual(
        await toTokenList("[[],[[]],{}]"),
        [
            { type: TokenType.ArrayOpen, value: "[" },
            { type: TokenType.ArrayOpen, value: "[" },
            { type: TokenType.ArrayClose, value: "]" },
            { type: TokenType.Comma, value: "," },
            { type: TokenType.ArrayOpen, value: "[" },
            { type: TokenType.ArrayOpen, value: "[" },
            { type: TokenType.ArrayClose, value: "]" },
            { type: TokenType.ArrayClose, value: "]" },
            { type: TokenType.Comma, value: "," },
            { type: TokenType.ObjectOpen, value: "{" },
            { type: TokenType.ObjectClose, value: "}" },
            { type: TokenType.ArrayClose, value: "]" },
        ],
    );

});

test("whitespace", async t => {
    t.deepEqual(
        await toTokenList(" {  }   "),
        [
            { type: TokenType.Whitespace, value: " " },
            { type: TokenType.ObjectOpen, value: "{" },
            { type: TokenType.Whitespace, value: "  " },
            { type: TokenType.ObjectClose, value: "}" },
            { type: TokenType.Whitespace, value: "   " },
        ],
    );

});

test("string", async t => {
    t.deepEqual(
        await toTokenList(' "a\\"bc" '),
        [
            { type: TokenType.Whitespace, value: " " },
            { type: TokenType.StringOpen, value: "\"" },
            { type: TokenType.StringChunk, value: "a\"bc" },
            { type: TokenType.StringClose, value: "\"" },
            { type: TokenType.Whitespace, value: " " },
        ],
    );

});

test("keyword", async t => {
    t.deepEqual(
        await toTokenList(' false  true  null '),
        [
            { type: TokenType.Whitespace, value: " " },
            { type: TokenType.False, value: "false" },
            { type: TokenType.Whitespace, value: "  " },
            { type: TokenType.True, value: "true" },
            { type: TokenType.Whitespace, value: "  " },
            { type: TokenType.Null, value: "null" },
            { type: TokenType.Whitespace, value: " " },
        ],
    );
});

test("object with members", async t => {
    t.deepEqual(
        await toTokenList('{"a":true}'),
        [
            { type: TokenType.ObjectOpen, value: "{" },
            { type: TokenType.StringOpen, value: "\"" },
            { type: TokenType.StringChunk, value: "a" },
            { type: TokenType.StringClose, value: "\"" },
            { type: TokenType.Colon, value: ":" },
            { type: TokenType.True, value: "true" },
            { type: TokenType.ObjectClose, value: "}" },
        ],
    );
});

async function toTokenList(chunks: AsyncIterable<string> | Iterable<string>) {
    const tokens = jsonTokenizer(chunks);
    const list = new Array<Token>();
    for await (const token of tokens) {
        list.push(token);
    }
    return list;
}
