import http from 'http'
import path from 'path'
import fs, { ReadStream } from 'fs'
import FormData from 'form-data'

interface IFormDataRequest {
    url: string,
    formData: FormData[]
}

interface INamesFile {
    men: string[],
    women: string[]
}

interface IUserImages {
    men: {
        path: string,
        bufferArray: Array<ReadStream>
    },
    women: {
        path: string,
        bufferArray: Array<ReadStream>
    }
}

function getFileData() {
    const images: IUserImages = {
        men: {
            path: path.resolve('./', 'men'),
            bufferArray: [],
        },
        women: {
            path: path.resolve('./', 'women'),
            bufferArray: [],
        }
    }

    let category: keyof typeof images

    for(category in images) {
        let files = fs.readdirSync(images[category].path, {
            withFileTypes: true
        })

        files.forEach(f => {
            let filePath = path.resolve(images[category].path +"/"+ f.name)

            let stream = fs.createReadStream(filePath)

            images[category].bufferArray.push(stream)
        })
    }

    return images
}

function getUsersFormData(userImages: IUserImages) {
    let names_file: INamesFile = require('./names.json');
    let users: Array<FormData> = []

    let category: keyof typeof names_file
    
    for(category in names_file) {
        names_file[category].forEach((name, i) => {
            let form = new FormData()

            form.append('login', `user_${category.toString()}_${i}`)
            form.append('password', `user_${category.toString()}_${i}`)
            form.append('username', name)
            form.append('photo', userImages[category].bufferArray[i])
            
            users.push(form)
        })
    }

    return users
}

function sendFormDataRequests(config: IFormDataRequest) {
    let requests: Array<Promise<any>> = []

    config.formData.forEach(form => {
        requests.push(new Promise((resolve, reject) => {
            const req = http.request(config.url, {
                method: 'POST',  
                headers: form.getHeaders()
            }, res => {
                let data = ''
                
                res.on('data', chunk => {
                    data += chunk
                })
                
                res.on('end', () => {
                    resolve(JSON.parse(data))
                }) 
            }).on('error', err => {
                reject(err)
            })
            
            form.pipe(req)
        }))
    })
    
    Promise.all(requests).then(result => {
        console.log(result)
    }).catch(err => {
        console.log(err)
    })
}

let userImages = getFileData()
let usersFormData = getUsersFormData(userImages)
sendFormDataRequests({
    url: 'http://localhost:5000/register',
    formData: usersFormData
})
