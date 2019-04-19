function Promise (executor) {
    const pm = this
    pm.status = 'pending'
    pm.onResolveCallback = []
    pm.onRejectCallback = []
  
    function resolve (value) {
      if (value instanceof Promise) {
        return value.then(resolve, reject)
      }
  
      setTimeout(() => {
        if (pm.status === 'pending') {
          pm.value = value
          pm.status = 'fulfilled'
          pm.onResolveCallback.forEach(callback => callback(pm.value))
        }
      })
    }
  
    function reject (reason) {
      setTimeout(() => {
        if (pm.status === 'pending') {
          pm.reason = reason
          pm.status = 'rejected'
          pm.onRejectCallback.forEach(callback => callback(pm.reason))
        }
      })
    }
  
    try {
      executor(resolve, reject)
    } catch (err) {
      reject(err)
    }
  }
  
  Promise.prototype.then = function (onResolve, onReject) {
    const pm = this
    let pm2
    onResolve = typeof onResolve === 'function' ? onResolve : value => value
    onReject = typeof onReject === 'function' ? onReject : reason => { throw (reason) }
  
    if (pm.status === 'fulfilled') {
      return pm2 = new Promise((resolve, reject) => setTimeout(() => {
        try {
          const x = onResolve(pm.value)
          resolvePromise(pm2, x, resolve, reject)
        } catch (err) {
          reject(err)
        }
      }))
    }
  
    if (pm.status === 'rejected') {
      return pm2 = new Promise((resolve, reject) => setTimeout(() => {
        try {
          const x = onReject(pm.reason)
          resolvePromise(pm2, x, resolve, reject)
        } catch (err) {
          reject(err)
        }
      }))
    }
  
    if (pm.status === 'pending') {
      return pm2 = new Promise((resolve, reject) => {
        pm.onResolveCallback.push(value => {
          try {
            const x = onResolve(value)
            resolvePromise(pm2, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
  
        pm.onRejectCallback.push(reason => {
          try {
            const x = onReject(reason)
            resolvePromise(pm2, x, resolve, reject)
          } catch (err) {
            reject(err)
          }
        })
      })
    }
  }
  
  function resolvePromise (promise, x, resolve, reject) {
    if (promise === x) {
      return reject(new TypeError)
    }
  
    if (x instanceof Promise) {
      if (x.status === 'pending') {
        x.then(value => resolvePromise(promise, value, resolve, reject), reject)
      } else {
        x.then(resolve, reject)
      }
  
      return
    }
  
    let thenCalledOrThrow = false
    if (typeof x === 'function' || (x !== null && typeof x === 'object')) {
      try {
        let then = x.then
        if (typeof then === 'function') {
          then.call(x, function (value) {
            if (!thenCalledOrThrow) {
              thenCalledOrThrow = true
              return resolvePromise(promise, value, resolve, reject)
            }
          }, function (reason) {
            if (!thenCalledOrThrow) {
              thenCalledOrThrow = true
              return reject(reason)
            }
          })
        } else {
          resolve(x)
        }
      } catch (err) {
        if (!thenCalledOrThrow) {
          thenCalledOrThrow = true
          reject(err)
        }
      }
    } else {
      resolve(x)
    }
  }