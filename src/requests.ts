import {IFormDataRequest, IResponse, IRequest} from './interfaces'

import http, { IncomingMessage } from 'http'
import https from 'https'

export default {
    handleResponse(res: IncomingMessage, resolve: (value: IResponse | PromiseLike<IResponse>) => void) {
        let data = ''
                
        res.on('data', chunk => {
            data += chunk
        })
        
        res.on('end', () => {
            let response: IResponse = {
                info: res,
                data: JSON.parse(data)
            }
            resolve(response)
        }) 
    },

    sendFormDataRequest(config: IFormDataRequest) {
        let requests: Array<Promise<IResponse>> = []
    
        config.formData.forEach(form => {
            requests.push(new Promise<IResponse>((resolve, reject) => {
                const req = http.request(config.url, {
                    method: 'POST',  
                    headers: form.getHeaders()
                }, res => this.handleResponse(res, resolve))
                .on('error', err => {
                    reject(err)
                })
                
                form.pipe(req)
            }))
        })
        
        this.logResponses(requests)
    },

    sendRequest({method='POST', body, url, headers={
        "content-type": 'application/json',
        "Cookie": ''
    }, isHttps=false}: IRequest) {
        let reqPromise = new Promise<IResponse>((resolve, reject) => {
            const req = !isHttps 
                ? 
                    http.request(url, {
                        method: method,  
                        headers: headers
                    }, res => this.handleResponse(res, resolve))
                    .on('error', err => {
                        reject(err)
                    }) 
                :
                    https.request(url, {
                        method: method,  
                        headers: headers
                    }, res => this.handleResponse(res, resolve))
                    .on('error', err => {
                        reject(err)
                    })
        
            method.toUpperCase() == 'POST' && req.write(JSON.stringify(body))
            req.end()
        })

        this.logResponses([reqPromise])

        return reqPromise
    },
    
    logResponses(requests: Array<Promise<IResponse>>) {
        Promise.all<IResponse>(requests).then(resultArray => {
            resultArray.forEach(result => {
                console.log(result.data)
            })
        }).catch(err => {
            console.log(err)
        })
    }
}