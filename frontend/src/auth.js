const TOKEN_KEY = 'nc_token'
const USER_KEY = 'nc_user'

export function setToken(token){
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken(){
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken(){
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function logout(){
  clearToken()
  try{ window.location = '/' }catch(e){}
}

export function setUser(user){
  if (user && typeof user === 'object') {
    const userId = user.id || user._id
    if (userId) {
      user.id = userId
      user._id = userId
    }
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getUser(){
  const v = localStorage.getItem(USER_KEY)
  if (!v) return null
  try {
    const user = JSON.parse(v)
    if (user && typeof user === 'object') {
      const userId = user.id || user._id
      if (userId) {
        user.id = userId
        user._id = userId
      }
    }
    return user
  } catch (e) {
    return null
  }
}

export default {
  setToken, getToken, clearToken, setUser, getUser
}
