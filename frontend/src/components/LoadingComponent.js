import React from 'react'
import { useState, useRef, useEffect } from 'react'

const LoadingComponent = (props) => {
  const textput = props.textput || "Loading"
  const [text, setText] = useState(textput)
  const dotsRef = useRef(0) 
  useEffect(() => {
    const interval = setInterval(() => {
        dotsRef.current = (dotsRef.current + 1) % 4
        setText(`${textput}.` + ".".repeat(dotsRef.current))
    }, 500)
    return () => clearInterval(interval)
  }, [])
  return (
    <p className="fade-in m-0 mt-2">{text}</p>
  )
}

export default LoadingComponent