
export abstract class BaseType<T> {
    readonly internalType!: T;
    abstract parse(val: any): ParseResult<T>
}

export abstract class ComplexType<T, S> extends BaseType<T> {
    abstract construct(val: T): S;
}

export function ParseError(msg: string) {
    return new Error(msg);
}

export type ParseResult<T> = T | Error;
export function parseOk<T>(res: ParseResult<T>): res is T {
    return !(res instanceof Error);
}

export type Any = BaseType<any>;

type ObjectDefinition = {
    [k: string]: Any
};

type TypeOfObject<T extends ObjectDefinition> = {
    [k in keyof T]: T[k]["internalType"]
}

type UnionParams = [Any, ...Any[]]
type TypeOfUnion<T extends UnionParams> = T[number]["internalType"]
export type TypeOf<T extends Any> = T["internalType"];

export class ObjectType<T extends ObjectDefinition> extends ComplexType<TypeOfObject<T>, TypeOfObject<T> > {

    private readonly shape: T;

    constructor(shape: T) {
        super();
        this.shape = shape;
    }

    construct(v: TypeOfObject<T>): TypeOfObject<T> {
        return v;
    }

    parse(val: any): ParseResult<TypeOfObject<T>> {
        if(val === null) return ParseError("Got null, expected object")
        if(typeof val !== "object") return ParseError("Object expected");

        for(const key of Object.keys(this.shape)) {
            const entry = this.shape[key];
            const res = entry.parse(val[key]);

            if(!parseOk(res)) {
                return ParseError(`Error in property ${key}: ${res}`)
            }
        }

        return val as TypeOfObject<T>;
    }
}

export class NumberType extends BaseType<number> {
    parse(val: any): ParseResult<number> {
        const t = typeof val;
        if(t !== "number") return ParseError(`Expected number, got ${t}`)
        return val as number;
    }
}

export class StringType extends BaseType<string> {
    parse(val: any): ParseResult<string> {
        const t = typeof val;
        if(t !== "string") return ParseError(`Expected string, got ${t}`)
        return val as string;
    }
}

export class LiteralType<T extends string|number> extends BaseType<T> {
    private readonly value: T;

    constructor(value: T) {
        super();
        this.value = value;
    }

    parse(val: any): ParseResult<T> {
        if(val !== this.value) return ParseError(`Expected literal value ${this.value}, got ${val}`)
        return val as T;
    }
}

export class UnionType<T extends UnionParams> extends BaseType<TypeOfUnion<T>> {
    private readonly types: T;

    constructor(...types: T) {
        super();
        this.types = types;
    }

    parse(val: any): ParseResult<T> {
        for(const type of this.types) {
            const res = type.parse(val);
            if(parseOk(res)) return val as T;
        }

        return ParseError("Union parse failed")
    }

}
