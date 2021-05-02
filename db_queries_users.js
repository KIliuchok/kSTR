const Pool = require('pg').Pool
const { exec } = require('child_process');

const pool = new Pool({
    user: 'me',
    host: 'localhost',
    database: 'api',
    password: '13915388',
    port: 5432,
})


const getUsers = (req, response) => {
    pool.query('SELECT * FROM users ORDER BY id ASC', (err, res) =>{
        if (err) {
            throw err
        }
        response.status(200).json(res.rows)
    })
}

const getUserById = (req, response) => {
    const id = parseInt(req.params.id)

    pool.query('SELECT * FROM users WHERE id = $1', [id], (err, res) => {
        if (err) {
            throw err
        }
        res.status(200).json(res.rows)
    })
}

const createUser = (req, response) => {
    console.log("Someone tried contacting lol")
    const { name, email, pwd } = req.body
    exec (`python Users/kostia/Desktop/Website/public/password_hash.py ${pwd}`, (err, stdout, stderr) => {
        if (err) {
            throw err
        }
        const hashed_pwd = stdout
        pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id', [name, email, hashed_pwd], (err, res) => {
            if (err) {
                throw err
            }
            response.status(201).send(`User added with ID: ${res.rows[0]['id']}`)
        })
    })


}

const updateUser = (req, response) => {
    const id = parseInt(req.params.id)
    const { name, email, pwd } = request.body
    exec (`python password_hash.py ${pwd}`, (err, stdout, stderr) => {
        if (err) {
            throw err
        }
        const hashed_pwd = stdout
    })

    pool.query('UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4', [name, email, hashed_pwd, id], (err, res) => {
        if (err) {
            throw err
        }
        response.status(200).send(`User modified with ID: ${id}`)
    })
}

const deleteUser = (req, response) => {
    const id = parseInt(req.params.id)

    pool.query('DELETE FROM users WHERE id = $1', [id], (err, res) => {
        if (err) {
            throw err
        }
        response.status(200).send(`User deleted with ID: ${id}`)
    })
}

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
}

// End of DB shiz
