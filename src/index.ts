type RtString = {
    type: "string"
}

type RtNumber = {
    type: "number"
}

type RtBoolean = {
    type: "boolean"
}

type RtArray<T extends RtAny> = {
    type: "array",
    itemType: T
}

type RtObjectProperties = {
    [key: string]: RtAny
}

type RtObject<T extends RtObjectProperties> = {
    type: "object",
    shape: T
}

type RtPrimitive = RtBoolean | RtString | RtNumber;
type RtAny = RtPrimitive | RtObject<any> | RtArray<any>

type ResolveProperties<T> = {
    [K in keyof T]: Resolve<T[K]>
}

type Resolve<T> = StaticResolve<T>

type StaticResolve<T> =
    T extends RtObject<infer U> ? ResolveProperties<U> :
    T extends RtArray<infer U> ? Resolve<U>[] :
    T extends RtNumber ? number :
    T extends RtString ? string :
    T extends RtBoolean ? boolean
    : unknown

function createNumber(): RtNumber {
    return {type: "number"}
}

function createString(): RtString {
    return {type: "string"}
}

function createBool(): RtBoolean {
    return {type: "boolean"}
}

function createArray<T extends RtAny>(type: T): RtArray<T> {
    return {type: "array", itemType: type}
}

function createObject<T extends RtObjectProperties>(value: T): RtObject<T> {
    return {type: "object", shape: value}
}

function _validate(message: RtAny, data: any): boolean {

    switch(message.type) {
        case "string":
            return typeof(data) === "string";
        case "number":
            return typeof(data) === "number";
        case "boolean":
            return typeof(data) === "boolean"
        case "array":
            if(!Array.isArray(data)) return false;
            return data.every(item => validate(message.itemType, item))
        case "object":
            if(typeof(data) !== "object") return false;
            for(const key of Object.keys(message.shape)) {
                const valid = _validate(message.shape[key], data[key])
                if(!valid) return false
            }
            return true;
    }

    return false;
}

function validate<T extends RtAny, D = Resolve<T>>(message: T, data: any): data is D {
    return _validate(message, data)
}

export {
    createArray as array,
    createObject as object,
    createBool as bool,
    createNumber as number,
    createString as string,
    Resolve,
    validate
}
