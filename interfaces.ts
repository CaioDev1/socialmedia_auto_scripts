import {ReadStream} from 'fs'
import {IncomingMessage} from 'http'
import FormData from 'form-data'

export interface IFormDataRequest {
    url: string,
    formData: FormData[]
}

export interface IRequest {
    url: string,
    method?: string,
    headers?: {
        'content-type': string,
        'Cookie': string
    },
    body?: Object,
    isHttps?: boolean
}

export interface IResponse {
    info: IncomingMessage,
    data: Object | any
}

export interface INamesFile {
    men: string[],
    women: string[]
}

export interface IUserImages {
    men: {
        path: string,
        bufferArray: Array<ReadStream>
    },
    women: {
        path: string,
        bufferArray: Array<ReadStream>
    }
}

export interface IUsersFromDatabase {
    users: Array<{
        _id: string,
        username: string,
        photo: string
    }>,
    allUsersLength: number
}