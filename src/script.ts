import FormData from 'form-data'
import fs from 'fs'
import path from 'path'
import { INamesFile, IUserImages } from './interfaces'
import requests from './requests'

function getUsersPhotoFileData() {
    const images: IUserImages = {
        men: {
            path: path.resolve('..', 'men'),
            bufferArray: [],
        },
        women: {
            path: path.resolve('..', 'women'),
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

let names_file: INamesFile = require('../names.json');
let category: keyof typeof names_file

function getUsersFormData(userImages: IUserImages) {
    let users: Array<FormData> = []

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
function sendPosts() {
    for(category in names_file) {
        names_file[category].forEach((name, i) => {
            requests.sendRequest({
                url: 'https://api.adviceslip.com/advice',
                method: 'GET',
                isHttps: true
            }).then(resAdvice => {
                let advice: string = resAdvice.data.slip.advice
    
                requests.sendRequest({
                    url: 'http://localhost:5000/login',
                    body: {
                        login: `user_${category.toString()}_${i}`,
                        password: `user_${category.toString()}_${i}`
                    }
                }).then(resLogin => {
                    let sessionCookie = resLogin.info.headers['set-cookie']

                    requests.sendRequest({
                        url: 'http://localhost:5000/posts',
                        headers: {
                            'content-type': 'application/json',
                            'Cookie': sessionCookie ? sessionCookie : ''
                        },
                        body: {
                            content: advice,
                        }
                    })
                })
            })
        })
    }
}

let userImages = getUsersPhotoFileData()
let usersFormData = getUsersFormData(userImages)

requests.sendFormDataRequest({
    url: 'http://localhost:5000/register',
    formData: usersFormData
})

sendPosts()