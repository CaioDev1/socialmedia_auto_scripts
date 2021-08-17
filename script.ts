import {IUserImages, INamesFile, IUsersFromDatabase, IRequest, IResponse} from './interfaces'

import dotenv from 'dotenv'
dotenv.config()
import path from 'path'
import fs from 'fs'
import FormData from 'form-data'

import requests from './requests'

function getUsersPhotoFileData() {
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

/* let userImages = getUsersPhotoFileData()
let usersFormData = getUsersFormData(userImages)

requests.sendFormDataRequest({
    url: 'http://localhost:5000/register',
    formData: usersFormData
}) */

requests.sendRequest({
    url: 'http://localhost:5000/login',
    body: {
        login: process.env.MY_LOGIN,
        password: process.env.MY_PASSWORD
    }
}).then(res1 => {
    let sessionCookie = res1.info.headers['set-cookie']

    requests.sendRequest({
        url: 'http://localhost:5000/userfilter?from=0&to=20&username=',
        method: 'GET',
        headers: {
            'content-type': 'application/json',
            'Cookie': sessionCookie ? sessionCookie.toString() : ''
        }
    }).then(res2 => {
        let usersFromDatabase = res2.data as IUsersFromDatabase
    
        let usersDatabasePath = path.resolve('./', 'usersDatabase.json')
    
        fs.writeFileSync(usersDatabasePath, JSON.stringify(usersFromDatabase))

        usersFromDatabase.users.forEach(user => {
            requests.sendRequest({
                url: 'https://api.adviceslip.com/advice',
                method: 'GET',
                isHttps: true
            }).then(resAdvice => {
                let advice: string = resAdvice.data.slip.quote
                console.log(sessionCookie)
                requests.sendRequest({
                    url: 'http://localhost:5000/posts',
                    body: {
                        db_user_id: user._id,
                        content: advice,
                        headers: {
                            'content-type': 'application/json',
                            'Cookie': sessionCookie ? sessionCookie.toString() : ''
                        }
                    }
                })
            }).catch(err => console.log(err))
        })
    }).catch(err => console.log(err))
}).catch(err => console.log(err))