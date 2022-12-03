import { color, extendTheme } from "@chakra-ui/react"
import "@fontsource/montserrat";


const theme = extendTheme({
    styles: {
		global: (props: any) => ({
			'::-webkit-scrollbar': {
				width: '5px',
			},
			'::-webkit-scrollbar-track': {
				background: 'transparent'
			},
			'::-webkit-scrollbar-thumb': {
				background: "#444" 
			},
		})
    }, 
    fonts: {
		heading: `'Montserrat', sans-serif`,
		body: `'Montserrat', sans-serif`,
    },
})

export default theme