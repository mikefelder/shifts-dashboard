/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
    console.error(err.stack)
    
    const error = {
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }

    res.status(err.status || 500).json({ error })
}

module.exports = errorHandler
