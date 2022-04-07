import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import RtcEngine, {
  RtcLocalView,
  RtcRemoteView,
  VideoRenderMode
} from 'react-native-agora';

import config from './constant/config.json';
import requestCameraAndAudioPermission from './components/Permission';
import styles from './components/Style';

const App = () => {
  const AgoraEngine = useRef(null);
  const [isJoined, setJoined] = useState(false);
  const [peerIds, setPeerIds] = useState([]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Request required permissions from Android
      requestCameraAndAudioPermission().then(() => {
        console.log('requested!');
      });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { appId } = config;
      AgoraEngine.current = await RtcEngine.create(appId);
      await AgoraEngine.current.enableVideo();

      AgoraEngine.current.addListener('Warning', warn => {
        console.log('Warning', warn);
      });

      AgoraEngine.current.addListener('Error', err => {
        console.log('Error', err);
      });

      AgoraEngine.current.addListener('UserJoined', (uid, elapsed) => {
        console.log('UserJoined', uid, elapsed);
        // If new user
        if (peerIds.indexOf(uid) === -1) {
          // Add peer ID to state array
          setPeerIds(prev => [...prev, uid]);
        }
      });

      AgoraEngine.current.addListener('UserOffline', (uid, reason) => {
        console.log('UserOffline', uid, reason);
        // Remove peer ID from state array
        setPeerIds(prev => prev.filter(id => id !== uid));
      });

      // If Local user joins RTC channel
      AgoraEngine.current.addListener(
        'JoinChannelSuccess',
        (channel, uid, elapsed) => {
          console.log('JoinChannelSuccess', channel, uid, elapsed);
          // Set state variable to true
          setJoined(true);
        }
      );
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCall = async () => {
    await AgoraEngine.current?.joinChannel(
      config.token,
      config.channelName,
      null,
      0
    );
  };

  const endCall = async () => {
    await AgoraEngine.current?.leaveChannel();
    setPeerIds([]);
    setJoined(false);
  };

  const renderVideos = () => {
    return isJoined ? (
      <View style={styles.fullView}>
        <RtcLocalView.SurfaceView
          style={styles.max}
          channelId={config.channelName}
          renderMode={VideoRenderMode.Hidden}
        />
        {renderRemoteVideos()}
      </View>
    ) : null;
  };

  const renderRemoteVideos = () => {
    return (
      <ScrollView
        style={styles.remoteContainer}
        contentContainerStyle={styles.padding}
        horizontal={true}>
        {peerIds.map(value => (
          <RtcRemoteView.SurfaceView
            style={styles.remote}
            uid={value}
            channelId={config.channelName}
            renderMode={VideoRenderMode.Hidden}
            zOrderMediaOverlay={true}
          />
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.max}>
      <View style={styles.buttonHolder}>
        {renderVideos() ? (
          <TouchableOpacity onPress={endCall} style={styles.button}>
            <Text style={styles.buttonText}> End Call </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startCall} style={styles.button}>
            <Text style={styles.buttonText}> Start Call </Text>
          </TouchableOpacity>
        )}
      </View>
      {renderVideos()}
    </View>
  );
};

export default App;
