const mongoose = require('mongoose')
const validator = require('validator')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('email invalido')
            }
        }
    },
    password: {
        type: String,
        trim: true,
        required: true,
        minlength: 3
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

userSchema.methods.generateToken = function() {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, 'superSecret', { expiresIn: '7 days' })

    user.tokens = user.tokens.concat({ token })

    user.save().then(function(user) {
        return token
    }).catch(function(error) {
        return error
    })
}

userSchema.statics.findByCredentials = function(email, password) {
    return new Promise(function(resolve, reject) {
        User.findOne({ email }).then(function(user) {
            if (!email) {
                return reject('User does not exist')
            } 
            bcryptjs.compare(password, user.password).then(function(match) {
                if (match) {
                    resolve(user)
                }
                reject('Wrong user or password')
            }).catch(function(error) {
                reject('Wrong user or password')
            })
        })
    })
}

userSchema.pre('save', function(next) {
    const user = this
    if (user.isModified('password')) {
        bcryptjs.hash(user.password, 8).then (function(hash) {
            user.password = hash
            next()
        }).catch(function(error) {
            return next(error)
        })
    } else {
        next()
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User
