export enum Role {
    USER = 'user',
    MODEL = 'model'
}

export interface MessagePart {
    text: string;
}

export interface Message {
    id: string;
    role: Role;
    parts: MessagePart[];
}

export interface Document {
    id: string;
    name: string;
    text: string;
}