import {faceAuth, faceScore, init, livenessScore, livenessValidate} from 'mosip-mobileid-sdk';
import * as React from 'react';
import {useEffect, useRef} from 'react';
import {Camera, ImageType} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import {Button, Image, Platform, ScrollView, Share, StyleSheet, Text, TextInput, View} from 'react-native';
import RNFS from 'react-native-fs';

export default function App() {
    const [image1, setImage1] = React.useState<{ path: string; data: string }>();
    const [image2, setImage2] = React.useState<{ path: string; data: string }>();
    const [showCam1, setShowCam1] = React.useState<boolean>(false);
    const [showCam2, setShowCam2] = React.useState<boolean>(false);
    const [permissionsGranted, setPermissionsGranted] = React.useState<boolean>(false);
    const [type, setType] = React.useState(Camera.Constants.Type.front);
    const camera1 = useRef<Camera>();
    const camera2 = useRef<Camera>();
    const [result, setResult] = React.useState<string>('')
    const [score, setScore] = React.useState<string>('')
    const [liveness1, setLiveness1] = React.useState<string>('Spoof: -, Score: -')
    const [liveness2, setLiveness2] = React.useState<string>('Spoof: -, Score: -')
    // load async
    useEffect(() => {
        init("https://github.com/biometric-technologies/tensorflow-facenet-model-test/raw/master/model.tflite",
            "https://github.com/biometric-technologies/liveness-detection-model/releases/download/v0.1.0/model_15_100.tflite")
            .catch(e => console.log(`Error: ${e}`))
            .then(res => {
                console.log(`========> sdk ready to use?: ${res}`);
            });
        Camera.requestCameraPermissionsAsync()
            .catch(e => console.log(`Camera Error: ${e}`))
            .then((status) => {
                console.log(JSON.stringify(status));
                const granted = status?.status === 'granted';
                setPermissionsGranted(granted);
            });
    }, []);

    const loadImage = async (
        index: number
    ): Promise<{ path: string; data: string }> => {
        if (Platform.OS === 'ios') {
            const path = `${RNFS.MainBundlePath}/assets/images/img${index}.jpg`;
            return {
                path: path,
                data: await RNFS.readFile(path, 'base64'),
            };
        } else if (Platform.OS === 'android') {
            const path = `images/img${index}.jpg`;
            return {
                path: `asset:/${path}`,
                data: await RNFS.readFileAssets(path, 'base64'),
            };
        } else {
            return {path: '', data: ''};
        }
    };
    const loadRandom1 = async () => {
        setShowCam1(false)
        const image1Dat = await loadImage(Math.floor(Math.random() * 6) + 1);
        setImage1(image1Dat);
    };

    const loadRandom2 = async () => {
        setShowCam2(false)
        const image2Dat = await loadImage(Math.floor(Math.random() * 6) + 1);
        setImage2(image2Dat);
    };

    const selectImage1 = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
            base64: true
        });
        if (!result.cancelled) {
            setImage1({
                data: result.base64!,
                path: result.uri
            })
        }
    };

    const selectImage2 = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
            base64: true
        });
        if (!result.cancelled) {
            setImage2({
                data: result.base64!,
                path: result.uri
            })
        }
    };

    const compareImages = async () => {
        if (image1 === undefined || image2 === undefined) {
            return;
        }
        setResult('Calculating ... Please wait')
        setScore('Score: -')
        setLiveness1('Spoof: -, Score: -')
        setLiveness2('Spoof: -, Score: -')
        const score = await faceScore(image1.data, image2.data);
        const result = await faceAuth(image1.data, image2.data);
        const liveness1Score = await livenessScore(image1.data)
        const liveness1Result = await livenessValidate(image1.data)
        const liveness2Score = await livenessScore(image2.data)
        const liveness2Result = await livenessValidate(image2.data)
        setLiveness1(`Spoof: ${liveness1Result}, Score: ${liveness1Score.toFixed(4)}`)
        setLiveness2(`Spoof: ${liveness2Result}, Score: ${liveness2Score.toFixed(4)}`)
        let matchResult: string;
        if (result) {
            matchResult = 'Images matched';
        } else {
            matchResult = 'Images not matched';
        }
        setResult(`Score: ${matchResult}`)
        setScore(score.toString(4))
    };

    const takeImg1 = async () => {
        const data = await camera1.current?.takePictureAsync({
            base64: true,
            imageType: ImageType.png, /*skipProcessing: true*/
        });
        if (data?.base64) {
            setImage1({
                data: data.base64,
                path: `data:image/png;base64,${data.base64}`
            });
            setShowCam1(false)
        }
    }
    const toggleType = async () => {
        if (type === Camera.Constants.Type.front) {
            setType(Camera.Constants.Type.back);
        } else {
            setType(Camera.Constants.Type.front);
        }
    }
    const takeImg2 = async () => {
        const data = await camera2.current?.takePictureAsync({
            base64: true,
            imageType: ImageType.png,
            quality: 0.5,
            skipProcessing: true,
        });
        if (data?.base64) {
            setImage2({
                data: data.base64,
                path: `data:image/png;base64,${data.base64}`
            });
            setShowCam2(false)
        }
    }

    const shareImage = async (id, text) => {
      const path = RNFS.DocumentDirectoryPath + `/image${id}.txt`;
      await RNFS.writeFile(path, text, 'utf8');
      const shareOptions = {
        url: 'file://' + path,

      };
      await  Share.share(shareOptions)
      await RNFS.unlink(path);
    }

    const shareImage1 = () => {
      shareImage(1, image1?.data)
    }

    const shareImage2 = () => {
      shareImage(2, image2?.data)
    }

    return (
        <ScrollView style={styles.container}>
            <Button title={'Toggle Camera Side'} onPress={toggleType}/>
            <View style={styles.vseparator}/>
            <Text style={styles.text}>Picture 1</Text>
            {(showCam1 && permissionsGranted) ?
                <Camera ref={camera1} type={type} style={styles.img1}>
                </Camera> :
                <Image style={styles.img1} source={{uri: image1?.path}}></Image>}
            <View style={styles.row}>
                <View style={styles.col}>
                    <Button title="Enable camera" onPress={() => setShowCam1(true)}/>
                    <View style={styles.vseparatorXs}/>
                    <Button title={'Take picture'} onPress={takeImg1}/>
                </View>
                <View style={styles.separator}/>
                <View style={styles.col}>
                    <Button title="Load random" onPress={loadRandom1}/>
                    <View style={styles.vseparatorXs}/>
                    <Button title="Load from photos" onPress={selectImage1}/>
                </View>
            </View>
            <Text style={styles.text}>Picture 2</Text>
            {(showCam2 && permissionsGranted) ?
                <Camera ref={camera2} type={type} style={styles.img2}>
                </Camera> :
                <Image style={styles.img2} source={{uri: image2?.path}}></Image>}
            <View style={styles.row}>
                <View style={styles.col}>
                    <Button title="Enable camera" onPress={() => setShowCam2(true)}/>
                    <View style={styles.vseparatorXs}/>
                    <Button title={'Take picture'} onPress={takeImg2}/>
                </View>
                <View style={styles.separator}/>
                <View style={styles.col}>
                    <Button title="Load random" onPress={loadRandom2}/>
                    <View style={styles.vseparatorXs}/>
                    <Button title="Load from photos" onPress={selectImage2}/>
                </View>
            </View>
            <View style={styles.vseparator}/>
            <Button title={'Compare'} onPress={compareImages}/>
            <Text style={styles.text}>{score}</Text>
            <Text style={styles.text}>{result}</Text>
            <Text style={styles.text}>{liveness1}</Text>
            <Text style={styles.text}>{liveness2}</Text>
            <View style={styles.vseparator}/>
            <Button title={'Share image 1'} onPress={shareImage1}/>
            <View style={styles.vseparator}/>
            <Button title={'Share image 2'} onPress={shareImage2}/>
            <View style={styles.vseparator}/>
            <View style={styles.vseparator}/>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
        color: '#ffffff',
        alignSelf: 'center'
    },
    col: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    separator: {
        width: 10,
    },
    vseparator: {
        height: 25,
    },
    vseparatorXs: {
        height: 5,
    },
    container: {
        paddingStart: 10,
        paddingEnd: 10,
        paddingTop: 25,
        paddingBottom: 25,
        backgroundColor: "black"
    },
    box: {
        width: 60,
        height: 60,
        marginVertical: 20,
    },
    img1: {
        justifyContent: 'center',
        alignSelf: 'center',
        aspectRatio: 1,
        width: 320,
        height: 240,
        margin: 5,
    },
    img2: {
        justifyContent: 'center',
        alignSelf: 'center',
        aspectRatio: 1,
        width: 320,
        height: 240,
        margin: 5,
    },
});
