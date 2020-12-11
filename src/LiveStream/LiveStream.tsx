import React from 'react';
import Poster from 'assets/images/stream.png';

import './LiveStream.scss';

interface LiveStreamProperties {
  liveStatus: boolean;

  server: string;
  source: string;
  // filename: string;
  elementId: string;

  options: any;

  sdpOffer: any;
  webRTCPeer: any;
  mediaPipeline: any;
  kurentoClient: any;
  playerEndpoint: any;
  webRTCEndpoint: any;
  recorderEndpoint: any;
  vehicleId: any;
}

class LiveStream extends React.Component<{ }, LiveStreamProperties> {
  defaultState = {
    liveStatus: false,
    sdpOffer: null,
    webRTCPeer: null,
    mediaPipeline: null,
    kurentoClient: null,
    playerEndpoint: null,
    webRTCEndpoint: null,
    recorderEndpoint: null,
    elementId: 'video-stream',
    server: 'wss://apac.cloudgroundcontrol.com/kurento',
    options: { mediaConstraints: { audio: false, video: {}, element: null } },
  };

  constructor(properties: any) {
    super(properties);

    const STUN = {
      urls: ['stun:52.64.236.197:3478'],
      // urls: 'stun.l.google.com:19302'
    };
    const TURN = {
      urls: ['turn:52.64.236.197:3478'],
      username: 'adnav',
      credential: 'CgKurent',
    };

    var iceServers = { iceServers: [TURN, STUN] };
    this.state = {
      ...this.defaultState,
      source: properties.source,
      vehicleId: properties.vehicleId,
      options: { mediaConstraints: { audio: false, video: {}, element: null }, iceServers },
    };
  }

  render() {
    return (
      <div className="live-stream" id={this.props.vehicleId}>
        <video
          poster={Poster}
          id={this.state.elementId}
          muted
          autoPlay
          height="309"
          width="380"
          onPlay={this.displayLiveVideoStatus}
        ></video>
        <div
          className="live-status"
          style={{ visibility: this.state.liveStatus ? 'visible' : 'hidden' }}
        >
          <span className="live-dot">&#x2B24;</span>
          <span className="live-text">live</span>
        </div>
      </div>
    );
  }

  displayLiveVideoStatus = () => {
    this.setState(state => {
      return { ...state, liveStatus: true };
    });
  };

  componentDidUpdate(
    // prevProps: Readonly<{ vehicleId }>,
    prevState: Readonly<LiveStreamProperties>,
    snapshot?: any,
  ) {
    // console.log('WebRTC Component updated');
    // if (prevProps.vehicleId !== this.props.vehicleId) {
      ///
      if (!!this.state.recorderEndpoint) this.state.recorderEndpoint.stop();
      if (!!this.state.playerEndpoint) this.state.playerEndpoint.stop();
      if (!!this.state.mediaPipeline) this.state.mediaPipeline.release();
      if (!!this.state.kurentoClient)
        if (!!this.state.webRTCPeer)
          // this.state.kurentoClient?.close();
          this.state.webRTCPeer.dispose();

      // console.log(this.props.vehicleId);
      // (document as any).addEventListener('DOMContentLoaded', () => {
      // console.info('WebRTC/Kurento component updating...');
      // eslint-disable-next-line  react/no-direct-mutation-state
      this.state.options.remoteVideo = (document as any).getElementById(this.state.elementId);
      this.setState(state => {
        return { ...state, webRTCPeer: this.createWebRTCPeer() };
      });
      // });
    // }
  }

  componentDidMount() {
    // console.log(this.props.vehicleId);
    // (document as any).addEventListener('DOMContentLoaded', () => {
    //   console.info('WebRTC/Kurento component mounting...');
    //   // eslint-disable-next-line  react/no-direct-mutation-state
    //   this.state.options.remoteVideo = (document as any).getElementById(this.state.elementId);
    //   this.setState(state => {
    //     return { ...state, webRTCPeer: this.createWebRTCPeer() };
    //   });
    // });
  }

  componentWillUnmount() {
    console.info('WebRTC/Kurento component unmounting...');
    if (!!this.state.recorderEndpoint) this.state.recorderEndpoint.stop();
    if (!!this.state.playerEndpoint) this.state.playerEndpoint.stop();
    if (!!this.state.mediaPipeline) this.state.mediaPipeline.release();
    if (!!this.state.kurentoClient) this.state.kurentoClient?.close();
    if (!!this.state.webRTCPeer) this.state.webRTCPeer.dispose();
  }

  createWebRTCPeer() {
    return (window as any).kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(this.state.options, error => {
      if (error) return this.onError('WebRTC peer connection handler', error);
      else this.state.webRTCPeer.generateOffer(this.onSDPOffer);
    });
  }

  onSDPOffer = (error: any, offer: any) => {
    if (error) return this.onError('on SDP offer handler', error);
    else
      this.setState(state => {
        return { ...state, sdpOffer: offer };
      });

    this.createKurentoClientIfNotExist();
  };

  createKurentoClientIfNotExist() {
    console.debug('Create KurentoClient');
    if (this.state.kurentoClient == null || this.state.kurentoClient === undefined) {
      (window as any).kurentoClient.getSingleton(this.state.server, (error, client) => {
        if (error) {
          console.error('Error creating kurentoClient');
          return this.onError('Kurento create client handler', error);
        }

        this.setState(state => {
          return { ...state, kurentoClient: client };
        });
        this.createMediaPipeline(this.state.kurentoClient);
      });
    } else {
      this.createMediaPipeline(this.state.kurentoClient);
    }
  }

  createMediaPipeline(client) {
    console.debug('Create MediaPipeline');
    client.create('MediaPipeline', (error, pipeline) => {
      if (error) return this.onError('Create media pipeline handler', error);

      this.setState(state => {
        return { ...state, mediaPipeline: pipeline };
      });
      this.createEndpoints();
    });
  }

  createEndpoints() {
    const rtspEndpoint = this.lookUpRtspByVehicleId(this.props.vehicleId);
    console.log('Rtsp endpoint: ' + rtspEndpoint);
    const endpoints = [
      // {
      //   type: 'RecorderEndpoint',
      //   params: {
      //     uri: this.state.filename,
      //     stopOnEndOfStream: true,
      //     mediaProfile: 'WEBM_VIDEO_ONLY',
      //   },
      // },
      { type: 'PlayerEndpoint', params: { uri: rtspEndpoint, networkCache: 0 } },
      { type: 'WebRtcEndpoint', params: {} },
    ];

    this.state.mediaPipeline.create(endpoints, (error, endpoints) => {
      if (error) return this.onError('Create endpoints handler', error);

      this.setState(state => {
        return {
          ...state,
          // recorderEndpoint: endpoints[0],
          // playerEndpoint: endpoints[1],
          // webRTCEndpoint: endpoints[2],
          playerEndpoint: endpoints[0],
          webRTCEndpoint: endpoints[1],
        };
      });

      this.state.webRTCEndpoint.on('OnIceCandidate', event => {
        this.state.webRTCPeer.addIceCandidate(
          event.candidate,
          this.onError.bind(null, 'Local addIceCandidate handler'),
        );
      });
      this.state.webRTCPeer.on('icecandidate', candidate => {
        candidate = (window as any).kurentoClient.getComplexType('IceCandidate')(candidate);
        this.state.webRTCEndpoint.addIceCandidate(
          candidate,
          this.onError.bind(null, 'Remote add ice candidate handler'),
        );
      });

      this.processSDPOffer();
      this.connectEndpoints();
    });
  }

  /**
   * luant - hardcode rtsp urls
   * @param vehicleId
   */
  lookUpRtspByVehicleId(vehicleId: string) {
    // let rtspUrl = '';
    // if (vehicleId === 'luant-drone') {
    //   rtspUrl = 'rtsp://192.168.1.64:8554/luant-drone';
    // } else if (vehicleId === 'demo_px4_drone_0001') {
    //   rtspUrl = 'rtsp://192.168.1.136:8554/demo_px4_drone_0001';
    // } else {
    //   rtspUrl = '';
    // }

    // if (rtspUrl !== '') {
    //   this.setState({
    //     ...this.state,
    //   });
    // }

    // return rtspUrl;
    return 'rtsp://admin:cloudgroundcontrol@10.10.0.18:554/h264Preview_01_main';
  }

  processSDPOffer() {
    this.state.webRTCEndpoint.processOffer(this.state.sdpOffer, (error, answer) => {
      if (error) return this.onError('Process offer handler', error);

      this.state.webRTCPeer.processAnswer(answer);
      this.state.webRTCEndpoint.gatherCandidates(
        this.onError.bind(null, 'Gather candidates handler'),
      );
    });
  }

  connectEndpoints() {
    this.state.mediaPipeline.connect(
      this.state.webRTCEndpoint,
      this.state.webRTCEndpoint,
      error => {
        if (error) return this.onError('WebRTC endpoint connect handler', error);

        this.state.playerEndpoint.connect(this.state.webRTCEndpoint, error => {
          if (error) return this.onError('Recorder endpoint connect handler', error);

          //this.state.playerEndpoint.connect(this.state.recorderEndpoint, error => {
          //if (error) return this.onError('Player endpoint connect handler', error);

          this.state.playerEndpoint.play(error => {
            if (error) return this.onError('Player play handler', error);

            //this.state.recorderEndpoint.record(this.onError.bind('Recorder play handler', error));
          });
          //});
        });
      },
    );
  }

  onError(tag, error) {
    if (!!error) console.error('WebRTC ' + tag + ',', error);
  }
}

export default LiveStream;
