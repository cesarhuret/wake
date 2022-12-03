import {useState, useEffect} from "react"
import {
  ChakraProvider,
  Box,
  Text,
  Link,
  VStack,
  Code,
  Grid,
  Button,
  HStack,
  Input,
  Stack,
  Image,
} from "@chakra-ui/react"
import { ColorModeSwitcher } from "./ColorModeSwitcher"
import { ControlledNumberInput } from "./ControlledNumberInput"
import "@fontsource/montserrat";
import theme from "./theme";

const CLIENT_ID = 'a7995e31f75d49cc9eca0c75beab988a'
const REDIRECT_URI = "https://wake.kesar.dev"
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize"
const RESPONSE_TYPE = "token"

export const App = () => {

	const [token, setToken] = useState<string | null>('');

	const [user, setUserData] = useState<any>(null);

	const [wakeUp, setWakeUp] = useState<string>('');
	const [onRepeat, setOnRepeat] = useState<string>('');

	const [danceability, setDanceability] = useState<number>(0.5);
	const [energy, setEnergy] = useState<number>(0.5);
	const [loudness, setLoudness] = useState<number>(0.5);
	const [valence, setValence] = useState<number>(0.5);

	const [filteredList, setFilteredlist] = useState<any[]>([]);

	console.log(user)

	const params = [
		{
			name: 'Danceability',
			variable: danceability,
			setter: setDanceability,
			min: 0,
			max: 1,
			defaultValue: 0.75,
			operator: 'lessthan',
			description: 'The smaller, the less danceable'
		},
		{
			name: 'Energy',
			variable: energy,
			setter: setEnergy,
			min: 0,
			max: 1,
			defaultValue: 0.5,
			operator: 'lessthan',
			description: 'The smaller, the less energetic'
		},
		// {
		// 	name: 'Loudness',
		// 	variable: loudness,
		// 	setter: setLoudness,
		// 	min: -60,
		// 	max: 0,
		// 	defaultValue: -15,
		// 	operator: 'greaterthan'
		// },
		{
			name: 'Valence',
			variable: valence,
			setter: setValence,
			min: 0,
			max: 1,
			defaultValue: 0.7,
			operator: 'greaterthan',
			description: 'The bigger, the more positive'
		}
	]

	useEffect(() => {

		const initialise = async () => {
			try {
				const hash: string = window.location.hash
				let token = window.localStorage.getItem("token")
			
				if (!token && typeof hash !== undefined) {
					const parsedHash = hash?.substring(1)?.split("&")?.find(elem => elem?.startsWith("access_token"))?.split("=")[1];
					token = typeof(parsedHash) == 'undefined' ? '' : parsedHash;
					window.location.hash = ""
					window.localStorage.setItem("token", token)
				}
		
				setToken(token)
	
				return {token: token, success: true} as any
			} catch(e) {
				console.log(e)
				return {success: false}
			}
		}

		initialise()
	
	}, [])

	useEffect(() => {

		const postInitialisation = async () => {

			const userData = await getUserData();


			if(userData.success == true) {
				setUserData(userData.json);

				console.log(userData)

				getUserPlaylists();	
			}
		}

		console.log(token)
		token && postInitialisation()

	}, [token])

	const logout = () => {
		setToken('')
		window.localStorage.removeItem("token")
	}

	const run = async () => {

		const tracks = await getPlaylistTracks(onRepeat);

		const trackIds = tracks.map((track: any) => track.track.id)

		const audioFeatures = await fetch(
			"https://api.spotify.com/v1/audio-features?ids=" + trackIds.join(','),
			{
				method: 'GET',
				headers: {
					'Authorization': 'Bearer ' + token
				},
				mode: 'cors',
				cache: 'default'
			}
		)

		const featureJson = await audioFeatures.json()

		const requirements: any = {
			'danceability': danceability,
			'energy': energy,
			// 'loudness': loudness,
			'valence': valence
		}

		const filteredTracks = featureJson.audio_features.filter((track: any) => {
			return Object.keys(requirements).every((key) => {
				return params[Object.keys(requirements).indexOf(key)].operator == 'greaterthan' ? track[key] >= requirements[key] : track[key] <= requirements[key]
			})
		})

		console.log(filteredTracks)
		const filteredTrackIds = filteredTracks.map((track: any) => track.id)

		const filteredTrackData = await fetch(
			"https://api.spotify.com/v1/tracks?ids=" + filteredTrackIds.join(','),
			{
				method: 'GET',
				headers: {
					'Authorization': 'Bearer ' + token
				},
				mode: 'cors',
				cache: 'default'
			}
		)

		const dataJson = await filteredTrackData.json()
		console.log(dataJson)

		setFilteredlist(dataJson.tracks);

		createPlaylist(dataJson.tracks);
		
	}

	const getPlaylistTracks = async (id: string) => {
		const playlists = await fetch(
			"https://api.spotify.com/v1/playlists/" + id,
			{
				method: 'GET',
				headers: {
					'Authorization': 'Bearer ' + token
				},
				mode: 'cors',
				cache: 'default'
			}
		)

		console.log(playlists)

		const playlistJson = await playlists.json()

		const tracks = playlistJson.tracks.items
		return tracks;
	}

	const getUserPlaylists = async () => {
		const playlists = await fetch(
			"https://api.spotify.com/v1/me/playlists?limit=50",
			{
				method: 'GET',
				headers: {
					'Authorization': 'Bearer ' + token
				},
				mode: 'cors',
				cache: 'default'
			}
		)

		const playlistJson = await playlists.json()

		const names = playlistJson.items.map((item: any) => item.name)
		console.log(names)

		const onRepeat = playlistJson.items.find((playlist: any) => playlist.name == "On Repeat")?.id

		// get the ID of the playlist name is "Wakeuptify"
		const playlistId = playlistJson.items.find((playlist: any) => playlist.name == "Wakeuptify")?.id

		if(playlistId) {
			setWakeUp(playlistId)
		}
		if(onRepeat) {

			console.log(onRepeat)
			setOnRepeat(onRepeat)
		}
	}

	const getUserData = async () => {
		try {
			const me = await fetch(
				"https://api.spotify.com/v1/me",
				{
					method: 'GET',
					headers: {
						'Authorization': 'Bearer ' + token
					},
					mode: 'cors',
					cache: 'default'
				}
			)
	
			const json = await me.json()

			if(json.error) {
				console.log('hello')
				logout()
				return {success: false}
			}

			return {success: true, json: json};
		} catch (e) {
			return {success: false}
		}
	}

	const createPlaylist = async (filteredTracks: any[]) => {

		console.log(wakeUp)
		if(wakeUp.length == 0) {

			const createPlaylist = await fetch(
				"https://api.spotify.com/v1/users/" + user?.id + "/playlists",
				{
					method: 'POST',
					headers: {
						'Authorization': 'Bearer ' + token
					},
					mode: 'cors',
					cache: 'default',
					body: JSON.stringify({
						'name': 'Wakeuptify',
						'public': false,
						'description': 'My Wakeuptify Playlist'
					})
				}
			)

			const playlistJson = await createPlaylist.json()
			console.log(playlistJson)

			const filteredUris = filteredTracks.map((track: any) => track.uri)
			console.log(filteredUris)

			setWakeUp(playlistJson.id)

			addTracksToPlaylist(playlistJson.id, filteredUris);
		} else {
			const wakeUpTracks = await getPlaylistTracks(wakeUp);
			const trackUris = wakeUpTracks.map((track: any) => { return { 'uri': track.track.uri}})

			console.log(trackUris)
			deletePlaylistTracks(wakeUp, trackUris);

			const filteredUris = filteredTracks.map((track: any) => track.uri)
			console.log(filteredUris)

			addTracksToPlaylist(wakeUp, filteredUris);
		}
	}

	const deletePlaylistTracks = async (id: string, tracks: any[]) => {
		const deleteTracks = await fetch(
			"https://api.spotify.com/v1/playlists/" + id + "/tracks",
			{
				method: 'DELETE',
				headers: {
					'Authorization': 'Bearer ' + token
				},
				mode: 'cors',
				cache: 'default',
				body: JSON.stringify({
					'tracks': tracks
				})
			}
		)

		const json = await deleteTracks.json()
		console.log(json)
		return json;
	}

	const addTracksToPlaylist = async (id: string, tracks: any[]) => {
		const addTracks = await fetch(
			"https://api.spotify.com/v1/playlists/" + id + "/tracks",
			{
				method: 'POST',
				headers: {
					'Authorization': 'Bearer ' + token
				},
				mode: 'cors',
				cache: 'default',
				body: JSON.stringify({
					'uris': tracks,
					'position': 0
				})
			}
		)

		const json = await addTracks.json()
		console.log(json)
		return json;
	}

	return (
		<ChakraProvider theme={theme}>
			<Box p={3} minH="100vh" maxH="100vh" fontFamily={'montserrat'} fontSize="xl">
				<HStack w={'full'} maxH={'3rem'} justifyContent={'flex-end'}>
					{token && user ?
						<HStack>
							<Image src={user?.images[0]?.url} h={'32px'} rounded={'50%'}/>
							<Text fontSize={'lg'}>{user.display_name}</Text>
							<Button onClick={logout}>Logout</Button>
						</HStack>
						: 
						<Button
							as={Link}
							href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=playlist-modify-public%20playlist-modify-private%20playlist-read-private`}
						>Login</Button>
					}
					<ColorModeSwitcher/>
				</HStack>
				<Stack my={3} minH={'90vh'} flexDirection={{base: 'column', md: 'row'}}>
					<VStack flex={1} spacing={8} justifyContent={'center'}>
						{token &&
							<VStack spacing={10}>
								{params.map((param, index) => (
									<VStack key={index} w={'full'} alignItems={'flex-start'}>
										<Text>{param.name} {param.operator == 'greaterthan' ? '>' : '<'} </Text>
										<Text fontSize={'sm'}>{param.description}</Text>
										<ControlledNumberInput 
											setValue={param.setter}
											min={param.min}
											max={param.max}
											defaultValue={param.defaultValue}
											step={0.1}
										/>
									</VStack>
								))}
								<Button w={'full'} onClick={run}>Update</Button>
							</VStack>
						}
					</VStack>
					{token &&
					<VStack flex={1} spacing={8}>
						<Text>Wakeuptify</Text>
						{token && filteredList && filteredList.length > 0 ?
							<VStack maxH={'80vh'} overflowY={'scroll'} spacing={4}>
								{filteredList.map((track, index) => (
									<HStack key={index} w={'full'} p={3} bgColor={'blackAlpha.500'} borderRadius={'lg'} alignItems={'center'}>
										<Text textAlign={'center'} w={10}>{index + 1}</Text>
										<Image h={'48px'} borderRadius={'md'} src={track.album.images[track.album.images.length - 1].url}/>
										<VStack alignItems={'left'}>					
											<Text fontSize={'md'} >{track.name}</Text>
											<Text fontSize={'sm'} >{track.artists.map((artist: any) => artist.name).join(', ')}</Text>
										</VStack>
									</HStack>
								))}
							</VStack>
							: <Text>No tracks found</Text>
						}
					</VStack>
					}
				</Stack>
			</Box>
			<Box position={'fixed'} bottom={'3'} left={'3'} backgroundColor={'blackAlpha.600'} p={2} borderRadius={'2xl'} border={'1px'} borderColor={'whiteAlpha.300'} >
				<Text fontSize={'sm'}>Built by <Link textColor={'blue.400'} href={'https://twitter.com/cesarhuret'}>Kesar</Link></Text>
			</Box>
		</ChakraProvider>
	)

}
