require('dotenv').config()   // load in env variables
const MongoClient =  require('mongodb').MongoClient;
const mongo = new MongoClient(process.env.DB_URL, { useUnifiedTopology: true })
const OpenTok = require('opentok')
const OT = new OpenTok(process.env.API_KEY, process.env.API_SECRET)

exports.handler = async(event, context) => {
    try {
        if(event.httpMethod == 'OPTIONS') {
            // 'OPTIONS' is an http method just like GET or POST
            return {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Allow': POST
                },
                statusCode: 204  // means no content
            }
        }
        
        const { name } = JSON.parse(event.body)   // Get the name from the request body
        await mongo.connect()       // establish connection to MongoDB database
        const sessions = await mongo.db('serverless_video_app').collection('sessions')   // store sessions in sessions collection
        
        // check if user has an existing session, if yes keep current one
        let session = await sessions.findOne({ name: name })

        // if no session exists for the user then create a new one
        if(!session) {
            const newSession = await createSession()
            // insert session into database
            await sessions.insertOne({
                name: name, 
                sessionId: newSession.sessionId
            })
            // update session with appropriate name and ID
            session = {
                name, 
                sessionId: newSession.sessionId
            }
        }

        // generate a token with the publisher role
        const token = OT.generateToken(session.sessionId, {role: 'publisher'})  // generate new every time, tokens have short lifetime
        
        // return the apiKey, sessionId, and token
        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            statusCode: 200,    // OK response
            body: JSON.stringify({
                apiKey: process.env.API_KEY,
                sessionId: session.sessionId,
                token: token
            })
        }


    } catch(e) {
        console.log(e)
        return {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            statusCode: 500,
            body: 'Error' + e
        }
    }

}

// Use asynchronous function to create a new session
const createSession = () => {
    return new Promise((resolve, reject) => {
        try {
            OT.createSession((error, session) => {
                if(error) reject(error)
                else resolve(session)
            })
        } catch(e) {
            reject(e)
        }
        
    })
}