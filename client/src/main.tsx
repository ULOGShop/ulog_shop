import React from "react"
import ReactDOM from "react-dom/client"

import {MantineProvider, createTheme} from "@mantine/core"
import {Notifications} from "@mantine/notifications"

import App from "./App"

import "@mantine/core/styles.css"
import "@mantine/notifications/styles.css"
import "./index.css"

import "./utils/suppressMantineWarnings"

const theme = createTheme({
    primaryColor: "lime",
    colors: {
        lime: [
            "#f4ffe4",
            "#e5facb",
            "#c9f39a",
            "#acec64",
            "#94e639",
            "#85e31d",
            "#BAF329",
            "#6ec414",
            "#5eae0d",
            "#4c9700",
        ],
        dark: [
            "#FFFFFF",
            "#CCCCCC",
            "#999999",
            "#666666",
            "#2a2a2a",
            "#1a1a1a",
            "#111111",
            "#111111",
            "#111111",
            "#111111",
        ],
    },
    fontFamily: "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
    defaultRadius: "sm",
})

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <MantineProvider theme={theme} defaultColorScheme="dark">
            <Notifications position="top-right"/>
            <App/>
        </MantineProvider>
    </React.StrictMode>,
)