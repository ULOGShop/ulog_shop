import {useEffect, useRef} from "react"

interface Node {
    x: number
    y: number
    targetX: number
    targetY: number
    size: number
    speed: number
    offset: number
}

interface Trail {
    x: number
    y: number
    life: number
}

export default function AnimatedBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const nodesRef = useRef<Node[]>([])
    const trailsRef = useRef<Trail[]>([])
    const mouseRef = useRef({x: -1000, y: -1000})
    const animationFrameRef = useRef<number>()
    const timeRef = useRef(0)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        const resizeCanvas = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            initNodes()
        }
        const initNodes = () => {
            const cols = Math.ceil(canvas.width/120)
            const rows = Math.ceil(canvas.height/120)
            nodesRef.current = []
            for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                    const x = i * 120 + 60
                    const y = j * 120 + 60
                    nodesRef.current.push({x, y, targetX: x, targetY: y, size: Math.random()*1.5 + 0.5, speed: Math.random()*0.08 + 0.05, offset: Math.random()*Math.PI*2})
                }
            }
        }
        resizeCanvas()
        window.addEventListener("resize", resizeCanvas)
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = {x: e.clientX, y: e.clientY}
            if (Math.random() > 0.7) {
                trailsRef.current.push({
                    x: e.clientX + (Math.random() - 0.5)*20,
                    y: e.clientY + (Math.random() - 0.5)*20,
                    life: 1,
                })
            }
        }
        window.addEventListener("mousemove", handleMouseMove)
        const animate = () => {
            timeRef.current += 0.015
            ctx.fillStyle = "#111111"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            trailsRef.current = trailsRef.current.filter((trail) => {
                trail.life -= 0.02
                if (trail.life > 0) {
                    ctx.fillStyle = `rgba(186, 243, 41, ${trail.life*0.3})`
                    ctx.beginPath()
                    ctx.arc(trail.x, trail.y, 2, 0, Math.PI*2)
                    ctx.fill()
                    return true
                }
                return false
            })
            nodesRef.current.forEach((node, i) => {
                const waveX = Math.sin(timeRef.current + node.offset)*30
                const waveY = Math.cos(timeRef.current*0.7 + node.offset)*30
                const dx = mouseRef.current.x - node.targetX
                const dy = mouseRef.current.y - node.targetY
                const distance = Math.sqrt(dx*dx + dy*dy)
                let influenceX = 0
                let influenceY = 0
                if (distance < 250) {
                    const force = (250 - distance)/250
                    influenceX = (dx/distance)*force*60
                    influenceY = (dy/distance)*force*60
                }
                node.x += (node.targetX + waveX + influenceX - node.x)*node.speed
                node.y += (node.targetY + waveY + influenceY - node.y)*node.speed
                const pulse = Math.sin(timeRef.current*2 + node.offset)*0.3 + 0.7
                ctx.fillStyle = `rgba(186, 243, 41, ${0.4*pulse})`
                ctx.beginPath()
                ctx.arc(node.x, node.y, node.size, 0, Math.PI*2)
                ctx.fill()
                nodesRef.current.forEach((otherNode, j) => {
                    if (i >= j) return
                    const dx = node.x - otherNode.x
                    const dy = node.y - otherNode.y
                    const dist = Math.sqrt(dx*dx + dy*dy)
                    if (dist < 150) {
                        const opacity = (1 - dist / 150)*0.15
                        let lineColor = `rgba(186, 243, 41, ${opacity})`
                        const midX = (node.x + otherNode.x)/2
                        const midY = (node.y + otherNode.y)/2
                        const mouseDist = Math.sqrt(Math.pow(mouseRef.current.x - midX, 2) + Math.pow(mouseRef.current.y - midY, 2))
                        if (mouseDist < 150) {
                            const mouseInfluence = (150 - mouseDist)/150
                            lineColor = `rgba(186, 243, 41, ${opacity + mouseInfluence*0.3})`
                        }
                        ctx.strokeStyle = lineColor
                        ctx.lineWidth = 0.5
                        ctx.beginPath()
                        ctx.moveTo(node.x, node.y)
                        ctx.lineTo(otherNode.x, otherNode.y)
                        ctx.stroke()
                        if (dist < 140 && i % 3 === 0) {
                            nodesRef.current.forEach((thirdNode, k) => {
                                if (k <= j || k % 2 !== 0) return
                                const d1 = Math.sqrt(Math.pow(node.x - thirdNode.x, 2) + Math.pow(node.y - thirdNode.y, 2))
                                const d2 = Math.sqrt(Math.pow(otherNode.x - thirdNode.x, 2) + Math.pow(otherNode.y - thirdNode.y, 2))
                                if (d1 < 140 && d2 < 140) {
                                    const triOpacity = ((1 - dist/140) + (1 - d1/140) + (1 - d2/140))/3
                                    ctx.fillStyle = `rgba(186, 243, 41, ${triOpacity*0.025})`
                                    ctx.beginPath()
                                    ctx.moveTo(node.x, node.y)
                                    ctx.lineTo(otherNode.x, otherNode.y)
                                    ctx.lineTo(thirdNode.x, thirdNode.y)
                                    ctx.closePath()
                                    ctx.fill()
                                }
                            })
                        }
                    }
                })
            })
            if (mouseRef.current.x > 0 && mouseRef.current.y > 0) {
                const gradient = ctx.createRadialGradient(mouseRef.current.x, mouseRef.current.y, 0, mouseRef.current.x, mouseRef.current.y, 100)
                gradient.addColorStop(0, "rgba(186, 243, 41, 0.05)")
                gradient.addColorStop(0.5, "rgba(186, 243, 41, 0.02)")
                gradient.addColorStop(1, "rgba(186, 243, 41, 0)")
                ctx.fillStyle = gradient
                ctx.beginPath()
                ctx.arc(mouseRef.current.x, mouseRef.current.y, 100, 0, Math.PI*2)
                ctx.fill()
                const ringPulse = Math.sin(timeRef.current*3)*10 + 60
                ctx.strokeStyle = `rgba(186, 243, 41, ${0.1*(1 - ringPulse/70)})`
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(mouseRef.current.x, mouseRef.current.y, ringPulse, 0, Math.PI*2)
                ctx.stroke()
            }
            const floatingCount = 20
            for (let i = 0; i < floatingCount; i++) {
                const angle = (i/floatingCount)*Math.PI*2 + timeRef.current
                const radius = 30 + Math.sin(timeRef.current*2 + i)*10
                const x = canvas.width/2 + Math.cos(angle)*radius
                const y = canvas.height/2 + Math.sin(angle)*radius
                ctx.fillStyle = `rgba(186, 243, 41, ${0.1 + Math.sin(timeRef.current + i)*0.05})`
                ctx.beginPath()
                ctx.arc(x, y, 1, 0, Math.PI*2)
                ctx.fill()
            }
            animationFrameRef.current = requestAnimationFrame(animate)
        }
        animate()
        return () => {
            window.removeEventListener("resize", resizeCanvas)
            window.removeEventListener("mousemove", handleMouseMove)
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [])
    return (<div style={{position: "fixed", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none"}}><canvas ref={canvasRef} style={{display: "block", width: "100%", height: "100%", background: "#111111"}}/></div>)
}