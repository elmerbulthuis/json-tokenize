export enum TokenType {
    Whitespace,
    ObjectOpen, ObjectClose,
    ArrayOpen, ArrayClose,
    StringOpen, StringClose, StringChunk,
    Number, True, False, Null,
    Comma, Colon,
}

export interface Token {
    type: TokenType,
    value: string,
}
