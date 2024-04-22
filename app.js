const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())

const dbpath = path.join(__dirname, 'userData.db')
let db = null

const initializeDb = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
  }
}

initializeDb()

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const selectUserQuery = `
  SELECT
    *
  FROM
    user
  WHERE
    username='${username}';`

  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    const hashedPassword = await bcrypt.hash(password, 10)
    const createUserQuery = `
    INSERT INTO
      user (username,name,password,gender,location)
    VALUES(
      '${username}',
      '${name}',
      '${hashedPassword}',
      '${gender}',
      '${location}'
    );`
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      await db.run(createUserQuery)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `
  SELECT
    *
  FROM
    user
  WHERE
    username='${username}';`

  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPassword = await bcrypt.compare(password, dbUser.password)
    if (isPassword === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `
  SELECT
    *
  FROM
    user
  WHERE
    username='${username}';`

  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isOldPassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (isOldPassword === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `
        UPDATE
          user
        SET password='${encryptedPassword}'
        WHERE username='${username}';`
        await db.run(updatePasswordQuery)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
