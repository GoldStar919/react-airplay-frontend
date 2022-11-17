import Clock from './Clock';
import { BiCheckbox, BiCheckboxChecked, BiExitFullscreen, BiFullscreen, BiPause, BiPlay, BiStop, BiLoaderAlt } from 'react-icons/bi';
import {ImVolumeHigh, ImVolumeLow, ImVolumeMedium, ImVolumeMute2} from 'react-icons/im'
import { Scrollbars } from 'react-custom-scrollbars';
import { useEffect, useRef, useState } from 'react';
import { MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowUp } from 'react-icons/md';
import { BsCheckCircleFill } from 'react-icons/bs';
import {AiFillCheckCircle, AiFillWarning} from 'react-icons/ai';
import {AuthService} from "../services/AuthService";
import { UserManager } from 'oidc-client';
import { Modal } from 'react-bootstrap';
import ReactPaginate from 'react-paginate'
import crypto from 'crypto';
// import Modal from '@mui/material/Modal';
// import Modal from "@material-tailwind/react/Modal";
// import ModalHeader from "@material-tailwind/react/ModalHeader";
// import ModalBody from "@material-tailwind/react/ModalBody";
// import ModalFooter from "@material-tailwind/react/ModalFooter";
import { uuid } from 'uuidv4';
// import PickyDateTime from 'react-picky-date-time';
import "react-datetime/css/react-datetime.css";
import DatetimePicker from "react-datetime";
import Select from 'react-select';
// import WaveSurfer from 'wavesurfer.js';
import { formatTimeCallback, primaryLabelInterval, secondaryLabelInterval, timeInterval } from '../helpers/main';
// import * as TimelinePlugin from '../helpers/wavesurfer_timeline.js';
// import * as WaveSurferRegions from '../helpers/wavesurfer_regions.js';
import videojs from 'video.js';
import axios from 'axios';
import { config } from '../config';
import moment from 'moment-timezone';
import "wavesurfer.js/dist/wavesurfer.min.js"
import  * as timeline from  "wavesurfer.js/dist/plugin/wavesurfer.timeline.js"
import  * as region from "wavesurfer.js/dist/plugin/wavesurfer.regions.js"
// import "videojs-wavesurfer/dist/videojs.wavesurfer.js"
// import "videojs-wavesurfer/dist/css/videojs.wavesurfer.css"
import 'bootstrap/dist/css/bootstrap.min.css';
import WaveSurfer from "wavesurfer.js"

function Player() {


  const authService = new AuthService();
  moment.tz.setDefault("Europe/Rome");
  const selectedTimeFrames = [
    '03:51:38',
    '03:51:39',
    '03:51:40',
    '03:51:41',
    '03:51:42',
    '03:51:43',
    '03:51:44',
    '03:51:45',
    '03:51:46',
    '03:51:47'
  ]

  const contentsDropdownOptions = {
    'BUMPERS': {
      value: true,
      label: 'BUMPERS'
    },
    'JINGLES': {
      value: true,
      label: 'JINGLES'
    },
    'PROMOS': {
      value: true,
      label: 'PROMOS'
    },
    'RECOGNIZED_SV': {
      value: true,
      label: 'RECOGNIZED_SV'
    },
    'PROPOSED_SV': {
      value: true,
      label: 'PROPOSED_SV'
    },
    'TRAILERS': {
      value: true,
      label: 'TRAILERS'
    }, 
    // this below value will be used in the search process but hidden in the contents dropdown menu section
    'UNKNOWN': {
      value: true,
      label: 'TRAILERS'
    }, 
  }

  // dummy data for the below table section

  // const availableTableItems = [
  //   {
  //     category: 'JINGLES',
  //     isSelected: false,
  //     isVerified: true,
  //     dateTime: '18/11/2021 10:20:10',
  //     channel: 'RTL 102.5',
  //     type: 'Jingle',
  //     duration: '40.2',
  //     matching: '40.2',
  //     name: 'jingle radio',
  //     program: 'Name of the program'

  //   },
  //   {
  //     category: 'BUMPERS',
  //     isSelected: false,
  //     isVerified: true,
  //     dateTime: '18/11/2021 10:20:20',
  //     channel: 'RTL 102.5',
  //     type: 'Bumper',
  //     duration: '20.2',
  //     matching: '20.2',
  //     name: 'Nestle spot',
  //     program: 'Name of the program'

  //   },
  //   {
  //     category: 'UNKNOWN',
  //     isSelected: true,
  //     isVerified: false,
  //     dateTime: '18/11/2021 10:20:30',
  //     channel: 'RTL 102.5',
  //     type: 'Unknown',
  //     duration: '20.2',
  //     matching: '',
  //     name: 'promo',
  //     program: 'Name of the program'

  //   }
  // ]

  const itemsPerPage = 25;

  const [videoPlayStatus, setVideoPlayStatus ] = useState('paused')
  const [unselectedFromStart, setUnselectedFromStart] = useState([]);
  const [unselectedFromEnd, setUnselectedFromEnd] = useState([]);
  const [datePickerValue ,setDatePickerValue] = useState(moment().subtract(50,'seconds'))
  const [volume, setVolume ] = useState(0.5)
  const [lastStoredVolume, setLastStoredVolume ] = useState(0.5)
  const [isMuted, setIsMuted ] = useState(false)
  const [isFullScreen, _setIsFullScreen ] = useState(false)
  const [isControlsVisible, setIsControlsVisible ] = useState(true)
  const isFullScreenRef = useRef(false);
  const [frameZoom, setFrameZoom ] = useState(50)
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [ isBeforeAfterSecondsFrameDropdownOpen, setBeforeAfterSecondsFrameDropdownOpen] = useState(false)
  const [isContentsDropdownOpen, setContentsDropdownOpen] = useState(false);
  const [waveformZoom, setWaveformZoom ] = useState(20)
  
  const [currentSourceItems, setCurrentSourceItems] = useState([]);
  const [selectedType, setSelectedType] = useState('Tv'); // for now it could be Tv or Radio
  const [selectedFrameOption, setSelectedFrameOption] = useState({
    value: '1',
    label: '1 Frame per second'
  });

  const [selectedBeforeAfterSecondsFrameOption_, setSelectedBeforeAfterSecondsFrameOption_] = useState({
    value: '3',
    label: '3 seconds before after'
  });
  let selectedBeforeAfterSecondsFrameOption = useRef(0);
  const setSelectedBeforeAfterSecondsFrameOption = (state) => {
    selectedBeforeAfterSecondsFrameOption.current = state;
    setSelectedBeforeAfterSecondsFrameOption_(state);
  }
  const [fingerprintModalOpen, setFingerprintModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [showFramesLoader, setShowFramesLoader] = useState(false);
  const [channelOptions, setChannelOptions] = useState({});
  const [currentContentsOptions, setCurrentContentsOptions] = useState(contentsDropdownOptions);
  const [filteredTableItems, setFilteredTableItems] = useState(currentSourceItems)
  const [currentSelectedRecordOnTable, setCurrentSelectedRecordOnTable] = useState(currentSourceItems)
  const [tableSearchField, setTableSearchField ] = useState("")
  const [framesToShow, setFramesToShow] = useState([]);
  const [channelsDropdown, setChannelsDropdown] = useState([]);
  const [selectedChannel, setSelectedChannel ] = useState({});

  const [multiSelectedChannel, setMultiSelectedChannel ] = useState([]);

  // fingerprint recognitions
  const [spotVersionName, setSpotVersionName]  = useState("")

  // company
  const [selectedCompany, setSelectedCompany ] = useState({});
  const [isCompanyLoading, setIsCompanyLoading ] = useState(false);
  const [companyOptions, setCompanyOptions ] = useState([]);
  // brands state
  const [selectedBrand, setSelectedBrand ] = useState({});
  const [brandOptions, setBrandOptions ] = useState([]);
  const [spotBrandOptions, setSpotBrandOptions ] = useState([]);
  const [allBrandOptions, setAllBrandOptions ] = useState([]);
  const [isBrandLoading, setIsBrandLoading ] = useState(false);

  // products state
  const [selectedProduct, setSelectedProduct ] = useState({});
  const [productOptions, setProductOptions ] = useState([]);
  const [allProductOptions, setAllProductOptions ] = useState([]);
  const [isProductLoading, setIsProductLoading ] = useState(false);

  // categories state
  const [selectedCategory, setSelectedCategory ] = useState({});
  const [categoryOptions, setCategoryOptions ] = useState([]);
  const [allCategoryOptions, setAllCategoryOptions ] = useState([]);
  const [isCategoryLoading, setIsCategoryLoading ] = useState(false);
    
  // sub categories state
  const [selectedSubCategory, setSelectedSubCategory ] = useState({});
  const [subCategoryOptions, setSubCategoryOptions ] = useState([]);
  const [allSubCategoryOptions, setAllSubCategoryOptions ] = useState([]);
  const [isSubCategoryLoading, setIsSubCategoryLoading ] = useState(false);

  // tag state
  const [tagOptions, setTagOptions ] = useState([]);
  const [allTagOptions, setAllTagOptions ] = useState([]);
  const [isTagLoading, setIsTagLoading ] = useState(false);

  // spot state
  const [selectedSpot, setSelectedSpot ] = useState({});
  const [spotOptions, setSpotOptions ] = useState([]);
  const [allSpotOptions, setAllSpotOptions ] = useState([]);
  const [isSpotLoading, setIsSpotLoading ] = useState(false);
  
  const [showChannelsDropdown, setShowChannelsDropdown] = useState(false);
  const [lastRequestDetails, setLastRequestDetails]= useState({})
  const [displayThumnailFullScreen, setDisplayThumnailFullScreen] = useState(null);
  const [showExportLoader, setShowExportLoader] = useState(false)

  // audio loader
  const [showAudioSectionLoader, setShowAudioSectionLoader] = useState(false)

  // table data state 
  const [isTabledataLoading, setIsTabledataLoading] = useState(false)
  const [_newlyFetchedTableData, _setNewlyFetchedTableData] = useState([]);
  
  const newlyFetchedTableData = useRef([]);
  const setNewlyFetchedTableData = (data) => {
    newlyFetchedTableData.current = data;
    _setNewlyFetchedTableData(data)
  }
  const [_allSources, _setAllSources] = useState([]);

  // type state
  const [typeName, setTypeName] = useState('')
  const [typeStates, setTypeStates] = useState({
    company: {
      name: ''
    },
    brand: {
      company: '',
      name: ''
    },
    product: {
      brand: '',
      name: ''
    },
    category: {
      name: ''
    },
    subcategory: {
      category: '',
      name: ''
    },
    tag: {
      name: ''
    },
    spot: {
      product: '',
      tag: '',
      subcategory: '',
      name: ''
    },
    spotversion: {
      name: ''
    }
  })

  // is logged in state
  const [isLoggedIn, setIsLoggedIn] = useState(false);


  // pagination state
  const [currentTableItems, setCurrentTableItems] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  // Here we use item offsets; we could also use page offsets
  // following the API or data you're working with.
  const [itemOffset, setItemOffset] = useState(0);

  // loaded audio file

  const [loadedAudioFile, setLoadedAudioFile] = useState("")

  // TV or RADIO selected state

  // const [isTVSelected, setisTVSelected] = useState(true)

  // audio and video channel options state

  const [availableRadioChannels, setAvailableRadioChannels] = useState([])
  const [availableTvChannels, setAvailableTvChannels] = useState([])

  const allSources = useRef([]);
  const setAllSources = (data) => {
    allSources.current = data;
    _setAllSources(data)
  }
  let waveform = useRef(false);
  let regionRef = useRef(false);
  let player = useRef(false);
  let thumnail_player = useRef(false);
  const thumbnailsAjaxRequest = useRef(0);
  const jwtToken = useRef(0);

  // var waveform;
  const setIsFullScreen = (val) => {
    isFullScreenRef.current = val;
    _setIsFullScreen(val)
  }

  // const extractFramesFromVideo = async  (videoUrl, fps=25, start) => {
  //   // console.log('pppppppppppppppppppppppppppppp', start.format('DD/MM/YYYY hh:mm:ss A'), moment.utc().format('DD/MM/YYYY HH:mm:ss'), moment(start).format('DD/MM/YYYY HH:mm:ss'));
  //   return new Promise(async (resolve) => {
  
  //     thumnail_player.current.src({
  //       src: videoUrl,
  //       type: 'application/x-mpegURL'
  //     })
  //     // thumnail_player.current.on('loadeddata',function(){
  //     //   console.log('it is ready now')
  //     // })
  //     let videoBlob;
  //     // fully download it first (no buffering):
  //     try{
  //       console.log('before fetch')
  //       videoBlob = await fetch(videoUrl).then(r => r.blob());
  //       console.log('after fetch')
  //     }
  //     catch(e){
  //       console.warn(e,'eeeeeeeeeeeeeeeee')
  //       return false;
  //     }
      
  //     let videoObjectUrl = URL.createObjectURL(videoBlob);
  //     // let video = document.getElementById("frames-video");
  //     // let video = document.querySelector("video#frames-video, #frames-video video");
  //     // video.setAttribute('id', 'frames-video');
      
  //     console.log('fffffffffff')
  //       let seekResolve;
  //       thumnail_player.current.on('timeupdate', async function() {
  //         if(seekResolve) seekResolve();
  //       });
  //       // video.addEventListener('seeked',function(){
  //       //   if(seekResolve) seekResolve();
  //       // })
    
  //       // thumnail_player.current.on('loadeddata', async function() {
  //       thumnail_player.current.on('loadeddata',async function(){

  //         console.log('loaded' )
  //         // return false;

  //         let video = document.querySelector("video#frames-video, #frames-video video");
  //         let canvas = document.createElement('canvas');
  //         let context = canvas.getContext('2d');
          
  //         // console.log(video.videoHeight, video.videoWidth,'(((((((((((((((((((((((((((((((((((((((((((((((((')
  //         let [w, h] = [video.videoWidth, video.videoHeight]
  //         canvas.width =  w;
  //         canvas.height = h;
  //         // console.log('fffffffffff 2nd')
  //         let frames = [];
  //         let interval = 1 / fps;
  //         let currentTime = 0;
  //         let duration = thumnail_player.current.duration();
  //         let time = start;
  //         // console.log(duration, currentTime,'iiiiiiiiiiiiiiiiiiii')
  //         while(currentTime < duration) {
  //           // console.log('before..........._________________________ currentTime before')
  //           video.currentTime = currentTime;
  //           thumnail_player.current.currentTime(currentTime);
  //           // console.log('before promise')
  //           await new Promise(r => seekResolve=r);
  //           // console.log('after promise seekresolve')
  //             context.drawImage(video, 0, 0, w, h);
  //             let base64ImageData = canvas.toDataURL();
              
  //             // console.log(currentTime,'__________________________________________',base64ImageData)
  //             frames.push({
  //               dateTimeMoment: time,
  //               timestamp: time?.valueOf?.(), 
  //               img: base64ImageData,
  //               time: ((fps===1)?time?.format?.('HH:mm:ss'):time?.format?.('HH:mm:ss.SSS'))
  //             });
      
  //             if(fps===1){
  //               time = start.add(1000,'milliseconds'); 
  //             }
  //             else if(fps===2){
  //               time = start.add(500,'milliseconds'); 
  //             }
  //             else if(fps===4){
  //               time = start.add(250,'milliseconds'); 
  //             }


  //           currentTime += interval;
            
  //         }
  //         resolve(frames);
  //       });
    
  //       // set video src *after* listening to events in case it loads so fast
  //       // that the events occur before we were listening.
  //       // video.src = videoObjectUrl; 
  //       // thumnail_player
  //     });



  
  //   // });
  // }
  
  const fetchStreamForTheSelectedOne = (selectedObj) =>{

  }
  const getSelectedSourceTypeUUID = (__selectedType) => {
    let returnType = false;
    config.sourceTypes.forEach((val)=>{
      if(String(val.name).toLowerCase()===String(__selectedType).toLowerCase()){
        returnType = val.sourceTypeUuid;
      }
    })
    return returnType;
  }
  const getTableRowsData = (sourcesData, __selectedType=false) => {
    let local__selectedType = __selectedType || selectedType;
    let selectedSouceTypeUUID = getSelectedSourceTypeUUID(local__selectedType);
    console.log(selectedSouceTypeUUID,'what you found there')
    let currentSources = [];
    let channelDropOptions = [];
    let videoChannels = [];
    let audioChannels = [];
    var isVideoChannel = true;
    sourcesData.forEach((val)=>{
      if(selectedSouceTypeUUID===val.sourceTypeUuid && ((config.recordingVideoChannels.indexOf(val.name)>-1 && (isVideoChannel="yes")) || (config.recordingAudioChannels.indexOf(val.name)>-1 && (isVideoChannel="no") )) ){
        let isSelected = false;
        if(currentSources.length===0){
          isSelected = true
        }
        // console.log(moment.utc().subtract(43,'seconds').format('DD/MM/YYYY hh:mm A'),'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii')
        currentSources.push({
          isVideoChannel,
          category: 'N/A',
          isSelected,
          isVerified: false,
          dateTime: moment.utc().subtract(50,'seconds'),
          channel:  val.name, // channel name
          type: 'N/A',
          duration: 40,
          matching: 40,
          name: 'N/A',
          program: 'N/A',
          channelSourceUuid: String(val.sourceUuid).toUpperCase()
        })
        let option = {
          label: val.name,
          value: String(val.sourceUuid).toUpperCase()
        };
        channelDropOptions.push(option)

        if(isVideoChannel==="yes"){
          videoChannels.push(option)
        }
        else{
          audioChannels.push(option)
        }
      }
    })
    
    setAvailableRadioChannels(audioChannels)
    setAvailableTvChannels(videoChannels)
    // here we process data according to type selected like TV or RADIO
    let dataHolder = local__selectedType==='Tv'?videoChannels: audioChannels
    console.log(dataHolder, audioChannels,'++++++++++++++++===========kkkkkkkkkkkkkkk gfk')
    if(dataHolder.length>0){ 
      setMultiSelectedChannel([dataHolder[0]])
      handleFetchClick([dataHolder[0]],local__selectedType);
    }
    setChannelsDropdown(dataHolder);
      
    
    
    
    return currentSources;
  }

  const playVideoAndGetFrames =  async (selectedSource) => {
    
    // console.log('yyyyyyyyyyyyyyyyyyyyyyy_________________',selectedSource.dateTime.valueOf(),(parseFloat(selectedSource.duration)*1000))
    let duration = selectedSource.duration || selectedSource.matching;
    setLastRequestDetails({
      channel: selectedSource.channelSourceUuid, 
      start: moment.unix(selectedSource.dateTime.unix()),
      duration,
      selectedSource,
      convertToLocal: selectedSource.dateTimeToShow?true: false
    })
    console.log(`${config.videosBaseUrl}:8081/nvenc-live/${selectedSource.channelSourceUuid}/playlist_fmp4_dvr_range-${selectedSource.dateTime.unix()}-${parseInt(duration)}.m3u8`,'cccccccccccccccccccccccccccccccccccccc')
    // http://office.radioairplay.fm:8081/nvenc-live/41A8599E-0823-E811-945C-549F351FC62C/playlist_dvr_range-1640110811-50.m3u8
    player.current.src({
      // original one
      // http://office.radioairplay.fm:8081/nvenc-live/41A8599E-0823-E811-945C-549F351FC62C/playlist_dvr_range-1640110805-50.m3u8
      // http://office.radioairplay.fm:8081/nvenc-inputs/08D24F8C-E77A-E911-90CC-00155DF10303/playlist_dvr_range-1638966060-120.m3u8
      
      
      // it is only for testing change it then remove adding 2 days thing
      src: `${config.videosBaseUrl}:8081/nvenc-live/${selectedSource.channelSourceUuid}/playlist_fmp4_dvr_range-${selectedSource.dateTime.clone().unix()}-${parseInt(duration)}.m3u8`,
      // with older recordings
      // src: `http://office.radioairplay.fm:8086/manage/dvr/export_mp4/nvenc-live/${selectedSource.channelSourceUuid}?start=${Math.round(selectedSource.dateTime.valueOf()/1000)}&end=${Math.round(selectedSource.dateTime.add((parseFloat((selectedSource.duration)*1000)), 'milliseconds').valueOf()/1000)}`,
      // src: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
      // type: 'application/x-mpegURL', 
      // mp4
      // src: `http://office.radioairplay.fm:8086/manage/dvr/export_mp4/nvenc-inputs/${selectedSource.channelSourceUuid}?start=${Math.round(selectedSource.dateTime.valueOf()/1000)}&end=${Math.round(selectedSource.dateTime.add((parseFloat(selectedSource.duration)*1000), 'milliseconds').valueOf()/1000)}`,
      // type: 'video/mp4',
      // withCredentials: true
    });
    


  //   // let video = document.getElementById('video-id_');
  //   // video.src = `http://office.radioairplay.fm:8086/manage/dvr/export_mp4/nvenc-inputs/${selectedSource.channelSourceUuid}?start=1638976060&end=1638976095`

  //   // player.current.play();
  //   // original one
  //   // let frames = await extractFramesFromVideo(`http://office.radioairplay.fm:8086/manage/dvr/export_mp4/nvenc-inputs/${selectedSource.channelSourceUuid}?start=${Math.round(selectedSource.dateTime.valueOf()/1000)}&end=${Math.round(selectedSource.dateTime.add((parseFloat((selectedSource.duration)*1000) + 3000), 'milliseconds').valueOf()/1000)}`, 1, selectedSource.dateTime);
  //   // with older recordings


  // player.current.on('timeupdate',function(e){
    // waveform.current.seekTo(e.target.currentTime)
    // let time = player.current.currentTime()/player.current.duration();
    // console.log('tttttttttttttttterrrrrr+++++++++++++++_____________________',player.current.currentTime(),player.current.duration(),time)
    
    // waveform.current.seekTo(time)
  // })
    
    let getThumnailsData = await generateThumbnails(selectedSource.channelSourceUuid, selectedSource.dateTime.clone().subtract(parseInt(selectedBeforeAfterSecondsFrameOption.current.value)*1000,'milliseconds').unix(),parseInt(parseFloat(duration)+Number(parseInt(selectedBeforeAfterSecondsFrameOption.current.value)*2)), parseInt(selectedFrameOption.value))
    // let frames = await extractFramesFromVideo(`http://office.radioairplay.fm:8081/nvenc-live/${selectedSource.channelSourceUuid}/playlist_dvr_range-${selectedSource.dateTime.subtract('3000','milliseconds').unix()}-${parseFloat(selectedSource.duration)+6}.m3u8`, parseInt(selectedFrameOption.value), selectedSource.dateTime);
    // setFramesToShow(frames);
    // if(getThumnailsData){
      
    // }
    
    // setShowFramesLoader(false);
        // console.log(frames);

        // let channel = selectedSource.channelSourceUuid;
        // let start_utc = Math.round(parseFloat(selectedSource.dateTime.valueOf())/1000);
        // let duration = selectedSource.duration;
        // let url = `${config.nodeServerUrl}/filepath/${channel}/${start_utc}/${duration}`;
        // axios.get(url, {
        //   headers: {
        //     'Accept': 'application/json',
        //     'Content-Type': 'application/json',
        //   },
          
        // }).then((res)=>{
        //   console.log(res.data)

        //   // throw new Error('test');
        // })
        // alert(url)
        // makeMp3File(selectedSource.channelSourceUuid, Math.round(selectedSource.dateTime.valueOf()/1000),selectedSource.duration)
        // let json = await variable.json();
        // console.log(variable )
        // variable.then((res)=>{
        //   // success
        //   if(res.status===200){
        //     if(waveform.current && res.data.fileToLoad){
        //       waveform.current.load(res.data.fileToLoad);
        //     }
            
        //   }
        // }).catch((e)=>{
        //   // console.warn(e);
        // })
        return false;
  }

  const loadAudioWaves = (filePath, file_duration) => {
    let WaveSurf = WaveSurfer;
    console.log(WaveSurf, WaveSurfer,'@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')

  if(waveform.current){
      waveform.current.destroy()
      waveform.current = false;
  }

  if(WaveSurf){


    waveform.current  = WaveSurf.create({
      container: document.querySelector('#waveform'),
      waveColor: '#D9D9D9',
      progressColor: '#625F27',
      cursorColor: 'red',
      backgroundColor: 'black',
      backend: 'MediaElement',
      barHeight: 2,
      height: 250,
      plugins: [
        region.create({
          maxRegions: 1,
          id: 'id__123',
          regions: [
              {
                  start: Number(selectedBeforeAfterSecondsFrameOption.current.value),
                  end: Number(parseFloat(file_duration/1000)-parseInt(selectedBeforeAfterSecondsFrameOption.current.value)),
                  color: 'hsla(200, 80%, 70%, 0.3)'
              }
          ]
      })
        ,
          timeline.create({
              container: '#timeline',
              formatTimeCallback: formatTimeCallback,
              timeInterval: timeInterval,
              primaryLabelInterval: primaryLabelInterval,
              secondaryLabelInterval: secondaryLabelInterval,
              primaryColor: 'white',
              secondaryColor: 'white',
              primaryFontColor: 'white',
              secondaryFontColor: 'white'
          })
      ]
  });


  }

  let slider = document.querySelector('#waveformZoomId');

  slider.value = waveform.current?.params?.minPxPerSec;
  slider.min = waveform.current?.params?.minPxPerSec;
  
  // slider.value = waveform.current.params.minPxPerSec;
  // slider.min = waveform.current.params.minPxPerSec;

  let typingTimer = false;
  slider.addEventListener('input', function() {
    console.log(Number(this.value),'ttttttttttttttt')
    clearTimeout(typingTimer);
    typingTimer = setTimeout(()=>{
      waveform.current.zoom(Number(this.value));
    }, 200);
    
  });

  // waveform.current.load(`/videos/audio_waveform.mp3`);
  
  
    // waveform.current.on('seek', function () {
      
    //   let video = document.getElementById('video-id');
    //   video.currentTime = waveform.current.getCurrentTime();
    // });
    

// });

  waveform?.current?.load?.(filePath);

  // waveform?.current?.load?.('/videos/audio_waveform.mp3');
  waveform.current.on('error', function(e) {
      console.warn(e,'error', filePath);
      // waveform.current.load(filePath);
  });
      waveform.current.on('ready', function () {
      
      // let video = document.getElementById('video-id');
      // video.currentTime = waveform.current.getCurrentTime();
    console.log(' now audio is ready')
    });
  console.log('ttttttteeeeeeessssssssttttttttt************', filePath)
  }
  const generateAudioChunk = async (channel, start, duration) => {

    start = start.subtract(2, 'days') // set dummy remove it before deployment
    channel = '8A4DEE2A-D37B-E911-90CC-00155DF10303'; // dummy set remove it before deployment
    console.log(start.clone().unix(), start.format('YYYY-MM-DD HH:mm:ss.SSS'),'}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}}')
    // `${config.videosBaseUrl}:8081/nvenc-live/${selectedSource.channelSourceUuid}/playlist_fmp4_dvr_range-${selectedSource.dateTime.clone().unix()}-${parseInt(duration)}.m3u8`
    try{
      let res =  await axios.get(`${config.nodeServerUrl}/generateAudioChunk/${channel}/${start.clone().unix()}/${duration}`);
          // if401Logout(res)
          setShowAudioSectionLoader(false)
          if(res.status===200 && res.data.success===true){
            // console.log(res.data,`${config.nodeServerUrl}/download/${res.data.filename}`)
            setLoadedAudioFile(res.data.filePath)
            loadAudioWaves(`${window.location.origin}/audios/${res.data.filePath}`, res.data.duration);
              // window.open(`${config.nodeServerUrl}/download/${res.data.filePath}`,'_self')
              
          }
          
      }
      catch(e){
        // alert(e.message);
        if401Logout(e.response)
        setShowAudioSectionLoader(false)
      }
  }
  const playAudio =  (selectedSource) => {


    let duration = selectedSource.duration || selectedSource.matching;
    setLastRequestDetails({
      channel: selectedSource.channelSourceUuid, 
      start: moment.unix(selectedSource.dateTime.unix()),
      duration,
      selectedSource,
      convertToLocal: selectedSource.dateTimeToShow?true: false
    })

    console.log(moment.unix(selectedSource.dateTime.unix()), moment.unix(selectedSource.dateTime.unix()).format('YYYY-MM-DD HH:mm:ss.SSS'),'{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{[')
    setShowAudioSectionLoader(true)
    generateAudioChunk(selectedSource.channelSourceUuid, moment.unix(selectedSource.dateTime.unix()), duration);
    
    // let slider = document.querySelector('#waveformZoomId');

  }

  useEffect(()=>{

    // if(waveform.current){
    //   waveform.current.destroy()
    //   waveform.current = false;
    // }
    // if(!waveform.current){
    document.addEventListener('DOMContentLoaded', function() {
      // alert('hello')

    })
  //      if(!waveform.current){

      
  //     document.addEventListener('DOMContentLoaded', function() {
  //       let WaveSurf = window.WaveSurfer;
  //     if(WaveSurf){
  //       waveform.current  = WaveSurf.create({
  //         container: document.querySelector('#waveform'),
  //         waveColor: '#D9D9D9',
  //         progressColor: '#625F27',
  //         cursorColor: 'red',
  //         backgroundColor: 'black',
  //         backend: 'MediaElement',
  //         barHeight: 2,
  //         xhr: {
  //           mode: 'no-cors'
  //         },  
  //         plugins: [
  //           WaveSurf.regions.create({
  //                 regions: [
  //                     {
  //                         start: 10,
  //                         end: 20,
  //                         color: 'hsla(200, 50%, 70%, 0.1)'
  //                     }
  //                 ]
  //             }),
  //             WaveSurf.timeline.create({
  //                 container: '#timeline',
  //                 formatTimeCallback: formatTimeCallback,
  //                 timeInterval: timeInterval,
  //                 primaryLabelInterval: primaryLabelInterval,
  //                 secondaryLabelInterval: secondaryLabelInterval,
  //                 primaryColor: 'white',
  //                 secondaryColor: 'white',
  //                 primaryFontColor: 'white',
  //                 secondaryFontColor: 'white'
  //             })
  //         ]
  //     });
      
  //   let slider = document.querySelector('#waveformZoomId');

  //   slider.value = waveform.current.params.minPxPerSec;
  //   slider.min = waveform.current.params.minPxPerSec;

  //   let typingTimer = false;
  //   slider.addEventListener('input', function() {
  //     console.log(Number(this.value),'ttttttttttttttt')
  //     clearTimeout(typingTimer);
  //     typingTimer = setTimeout(()=>{
  //       waveform.current.zoom(Number(this.value));
  //     }, 200);
      
  //   });
  
  //   waveform.current.load(`${config.nodeServerUrl}/sample-vid.mp4`);
  //   waveform.current.on('error', function(e) {
  //       console.warn(e);
  //       // waveform.current.load(`http://office.radioairplay.fm:8086/manage/dvr/export_mp4/nvenc-inputs/${selectedSource.channelSourceUuid}?start=1638976060&end=1638976095`);
  //   });
  //   waveform.current.on('ready',function(){
  //     waveform.current.play();
  //   })
  //     waveform.current.on('seek', function (e) {
        
  //       // let video = document.getElementById('video-id_');
  //       // console.log(video.currentTime, waveform.current.getCurrentTime(), e)
  //       // video.currentTime = e;
  //       // player.current.currentTime(e)
  //     });
  //     }

  // });
  // }

  return () => {
      
    if(waveform.current){
        waveform.current.destroy()
        waveform.current = false;
    }
  }
  },[selectedType])

  const generateThumbnails = async (channel, start, duration, fps) => {
    
    // return new Promise(async (resolve, reject) => {
      // setShowFramesLoader(true);
      // console.log(selectedFrameOption.value,'+++++++++++++++++++++++++++++++', fps)
    if(thumbnailsAjaxRequest.current){
      thumbnailsAjaxRequest.current.cancel()
    }

    thumbnailsAjaxRequest.current = axios.CancelToken.source(); 
    
    // axios.interceptors.request.use(function(config) {
      // Do something before request is sent
      console.log('Start Ajax Call');
      setShowFramesLoader(true);
      setFramesToShow([]);
      setUnselectedFromEnd([])
      setUnselectedFromStart([])
    //   return config;
    // }, function(error) {
    //   // Do something with request error
    //   // console.log('Error');
    //   return Promise.reject(error);
    // });
    try{
    let res =  await axios({
      method: 'GET',
      url: `${config.nodeServerUrl}/generateThumbnails/${channel}/${start}/${duration}/${fps}`,
      // timeout: 20000
      cancelToken: thumbnailsAjaxRequest.current.token
    });
        // if401Logout(res)
        if(res.status===200 && res.data.success===true && res.data?.data){
          console.log(res.data);
          // resolve(res.data?.data);

          initializeSelectednUnselectedFrames(res.data?.data, parseInt(selectedBeforeAfterSecondsFrameOption.current.value)*parseInt(fps))
        }
        else {
          console.warn('no response found');
        }
        setShowFramesLoader(false);
        
    }
    catch(e){
      
      if(axios.isCancel(e)){
        setShowFramesLoader(true);
      }else{
        setShowFramesLoader(false);
      }
      if401Logout(e.response)
      console.warn(e.message );
    }
    return false;
  // })
  }

  const initializeSelectednUnselectedFrames = (frames, howMany=3) => {

    let forStart = [...frames];
    let forEnd = [...frames];
    // howMany = howMany* selectedFrameOption.value;
    // console.log('___________________________ ',howMany, frames,selectedFrameOption.value , howMany* selectedFrameOption.value);
    let unselectedFromStartFrames = forStart.splice(0,howMany)
    let unselectedFromEndFrames = forEnd.splice(frames.length-howMany,howMany)
    let selectedFrames = forStart.splice(forStart.length-howMany,howMany);


    setUnselectedFromStart(unselectedFromStartFrames)
    setUnselectedFromEnd(unselectedFromEndFrames)
    setFramesToShow(forStart)
  }

  const convertNDownloadFile = async () => {
    let {channel, start, duration} = lastRequestDetails;
    setShowExportLoader(true);
    try{

      let res;
      if(selectedType==='Radio'){


        let current_region = (Object.values(waveform?.current?.regions?.list))[0];
        let start_audio = current_region['start']
        let end_audio = current_region['end']
        res =  await axios.get(`${config.nodeServerUrl}/cutAudioFile/${loadedAudioFile}/${start_audio}/${end_audio}`);
      }
      else{
        res =  await axios.get(`${config.nodeServerUrl}/filepath/${channel}/${start.clone().unix()}/${duration}`);
      }
      
        // if401Logout(res)
        if(res.status===200 && res.data.success===true){
          // console.log(res.data,`${config.nodeServerUrl}/download/${res.data.filename}`)
            window.open(`${config.nodeServerUrl}/download/${res.data.filename}`,'_self')
          
        }
        
    }
    catch(e){
      // alert(e.message);
      if401Logout(e.response)
    }
    setShowExportLoader(false);
  }
  
  const getUser = () => {

  }
//   function sha256(buffer) {
//     return crypto.createHash('sha256').update(buffer).digest();
//   }

//   function base64URLEncode(str) {
//     return str.toString('base64')
//         .replace(/\+/g, '-')
//         .replace(/\//g, '_')
//         .replace(/=/g, '');
// }
  useEffect(()=>{

    selectedBeforeAfterSecondsFrameOption.current = selectedBeforeAfterSecondsFrameOption_;
    let url = new URL(window.location.href);
    console.log('outside', url.searchParams, url);
    if(url.searchParams?.get?.('code')){
      console.log('inside', url.searchParams?.get?.('code'), url);
      new UserManager({ response_mode: "query" }).signinRedirectCallback().then(function (user) {
        console.log(user,'uuuuuuuuuussssssssseeeeeeeeeerrrrrrrrr ---------------------------------')
        if(user?.profile?.role?.indexOf?.('SpotAddAdmin')>-1){
          let newURL = new URL(window.location.href);
          if(newURL.searchParams.get('code')){
            window.location.replace(window.location.origin);
          }
          
          jwtToken.current = user;
          // if(!isLoggedIn)
          // setIsLoggedIn(true);
          // getSources()
        }
        else{
          // if(isLoggedIn)
          // setIsLoggedIn(false);
        }
        
        // window.location = "index.html";
    }).catch(function (e) {
        console.error(e);
    });
    }
    else
    {
      authService.getUser().then(user => {
        if (user) {
          console.log('User has been successfully loaded from store.');
          if(user?.profile?.role?.indexOf?.('SpotAddAdmin')>-1){
            // let newURL = new URL(window.location.href);
            // if(newURL.searchParams.get('code')){
            //   window.location.replace(window.location.origin);
            // }
            jwtToken.current = user;
            if(!isLoggedIn)
            setIsLoggedIn(true);
            getSources()
          }
          else{
            if(isLoggedIn)
            setIsLoggedIn(false);
          }
  
        } else {
          console.log('You are not logged in.');
        }
      });
    }

    // here we renew the token
    if(url.searchParams?.get?.('silent-renew')){
      let mgr = new UserManager({});
      mgr.signinSilentCallback().catch(function (error) {
        console.error(error);
      })
    }




  },[])

  useEffect(() => {
    let vid = document.getElementById('video-id_');
    if(displayThumnailFullScreen && vid?.style){
      vid.style.display = 'none';
    }
    else {
      vid?.style && (vid.style.display = '');
    }
    var listener = function (e){
      if(document?.getElementById?.('ChannelsSelector')?.contains?.(document?.elementFromPoint?.(e.clientX, e.clientY))){
        // alert('test')
      }
      else{
        
        if(showChannelsDropdown)
        setShowChannelsDropdown(false);
      }
    }
    window.addEventListener('click',listener)

    return ()=>{
      window.removeEventListener('click',listener)
    }
  })

  const getSources = () => {
    axios.get(config.sourcesUrl,{
      headers: {
        Authorization: 'Bearer ' + jwtToken?.current?.access_token
      }
    }).then((res)=>{
      // success
      console.log(res,'tttttttttttttttttt====================')
      
      if(res.status===200){
        setAllSources(res?.data);
        if(document.getElementById("video-id_")){
          player.current = videojs("video-id_", {})
        }
        let sourceItems = getTableRowsData(res?.data);
        // setCurrentSourceItems(sourceItems);
        
        // setFilteredTableItems(sourceItems)
        // let firstSelectedItem = sourceItems[0];
        // setCurrentSelectedRecordOnTable(firstSelectedItem)
        // playVideoAndGetFrames(firstSelectedItem);
        
        // setLastRequestDetails();
      }
      console.log(res,res?.data);
    }).catch((e)=>{
      // error
      if401Logout(e.response)
      console.warn(e.message)
      // alert('something went wrong');
    })
  }
  useEffect(()=>{


    if(document.getElementById("video-id_")){
      player.current = videojs("video-id_", {
        //   plugins: {
        //     wavesurfer: {
        //         backend: 'MediaElement',
        //         // displayMilliseconds: true,
        //         // debug: true,
                
        //         // progressColor: 'black',
        //         // cursorColor: 'black',
        //         // hideScrollbar: true,
        //         height:10,
        //         container: '#waveform',
        //       waveColor: '#D9D9D9',
        //       progressColor: '#625F27',
        //       cursorColor: 'red',
        //       backgroundColor: 'black',
        //       // backend: 'MediaElement',
        //       barHeight: 1,
        //         plugins: [
        //             // timeline
        //             timeline.create({
        //                             container: '#timeline',
        //                             formatTimeCallback: formatTimeCallback,
        //                             timeInterval: timeInterval,
        //                             primaryLabelInterval: primaryLabelInterval,
        //                             secondaryLabelInterval: secondaryLabelInterval,
        //                             primaryColor: 'white',
        //                             secondaryColor: 'white',
        //                             primaryFontColor: 'white',
        //                             secondaryFontColor: 'white'
        //                         }),
        //             // regions
        //             regions.create({
        //                     regions: [
        //                                   {
        //                                       start: 10,
        //                                       end: 15,
        //                                       color: 'hsla(200, 50%, 70%, 0.1)'
        //                                   }
        //                               ]
        //                           }),
        //             // regions.create({
        //             //     regions: [
        //             //         {
        //             //             start: 1.123,
        //             //             end: 5,
        //             //             color: 'rgba(255, 255, 205, 0.7)',
        //             //             drag: false
        //             //         }, {
        //             //             start: 6.5,
        //             //             end: 8,
        //             //             color: 'rgba(205, 255, 255, 0.6)',
        //             //             drag: false
        //             //         }
        //             //     ]
        //             // })
        //         ]
        //     }
        // }
        }, function(){
          console.log('loaded')
          // this.play()
        });
    }
    if(document.getElementById("frames-video")){
      thumnail_player.current =  videojs("frames-video",{},function(){
      })
    }

    // player.current.src({
      // original one
      // http://office.radioairplay.fm:8081/nvenc-inputs/08D24F8C-E77A-E911-90CC-00155DF10303/playlist_dvr_range-1638966060-120.m3u8
      // src: `http://office.radioairplay.fm:8081/nvenc-live/${selectedSource.channelSourceUuid}/playlist_dvr_range-${Math.round(selectedSource.dateTime.valueOf()/1000)}-${selectedSource.duration}.m3u8`,
      // with older recordings
      // src: `http://office.radioairplay.fm:8086/manage/dvr/export_mp4/nvenc-inputs/${selectedSource.channelSourceUuid}?start=1639562972&end=1639562992`,
      // src: 'http://office.radioairplay.fm:8081/nvenc-live/181A078F-ED46-E811-945C-549F351FC62C/playlist_dvr_range-1639724065-40.m3u8', 
      // type: 'application/x-mpegURL', 
      // mp4
      // src: `http://office.radioairplay.fm:8086/manage/dvr/export_mp4/nvenc-inputs/${selectedSource.channelSourceUuid}?start=${Math.round(selectedSource.dateTime.valueOf()/1000)}&end=${Math.round(selectedSource.dateTime.add((parseFloat(selectedSource.duration)*1000), 'milliseconds').valueOf()/1000)}`,
      // type: 'video/mp4',
      // withCredentials: true
    // });
    // player.current.on('timeupdate',function(){
    //   console.log('fasdfasdfas')
    // })
    // let frames = await extractFramesFromVideo("http://office.radioairplay.fm:8086/manage/dvr/export_mp4/nvenc-inputs/08D24F8C-E77A-E911-90CC-00155DF10303?start=1638976060&end=1638976260", 1);
    
    // console.log('tttttttttttt',frames);
    // player.src({
    //   src: 'http://office.radioairplay.fm:8081/nvenc-inputs/08D24F8C-E77A-E911-90CC-00155DF10303/playlist_dvr_range-1638966060-120.m3u8',
    //   type: 'application/x-mpegURL',
    //   // withCredentials: true
    // });

    // WaveSurfer.create()
  //   if(!waveform.current){

      
  //     document.addEventListener('DOMContentLoaded', function() {
  //       let WaveSurf = window.WaveSurfer;
  //     if(WaveSurf){
  //       waveform.current  = WaveSurf.create({
  //         container: document.querySelector('#waveform'),
  //         waveColor: '#D9D9D9',
  //         progressColor: '#625F27',
  //         cursorColor: 'red',
  //         backgroundColor: 'black',
  //         backend: 'MediaElement',
  //         barHeight: 2,
  //         plugins: [
  //           WaveSurf.regions.create({
  //                 regions: [
  //                     {
  //                         start: 10,
  //                         end: 100,
  //                         color: 'hsla(200, 50%, 70%, 0.1)'
  //                     }
  //                 ]
  //             }),
  //             WaveSurf.timeline.create({
  //                 container: '#timeline',
  //                 formatTimeCallback: formatTimeCallback,
  //                 timeInterval: timeInterval,
  //                 primaryLabelInterval: primaryLabelInterval,
  //                 secondaryLabelInterval: secondaryLabelInterval,
  //                 primaryColor: 'white',
  //                 secondaryColor: 'white',
  //                 primaryFontColor: 'white',
  //                 secondaryFontColor: 'white'
  //             })
  //         ]
  //     });
      
  //   let slider = document.querySelector('#waveformZoomId');

  //   slider.value = waveform.current.params.minPxPerSec;
  //   slider.min = waveform.current.params.minPxPerSec;

  //   let typingTimer = false;
  //   slider.addEventListener('input', function() {
  //     console.log(Number(this.value),'ttttttttttttttt')
  //     clearTimeout(typingTimer);
  //     typingTimer = setTimeout(()=>{
  //       waveform.current.zoom(Number(this.value));
  //     }, 200);
      
  //   });
  
  //   waveform.current.load('/videos/sample-video.mp4');
  //   waveform.current.on('error', function(e) {
  //       console.warn(e);
  //       waveform.current.load('/videos/sample-video.mp4');
  //   });
  //     waveform.current.on('seek', function () {
        
  //       let video = document.getElementById('video-id');
  //       video.currentTime = waveform.current.getCurrentTime();
  //     });
  //     }

  // });
  // }

  },[])


  // useEffect(()=>{
    // if(document && document.getElementById('video-id')){
    //   let video = document.getElementById('video-id');

    //   console.log('test video log',video.__proto__)
    //   // video.play()
    // }

    
    // window.addEventListener('keyup',onKeyDown)
    // return ()=> {
    //   window.removeEventListener('keyup',onKeyDown)
    // }
  // })

  const listener = (event) => {

    if (document.fullscreenElement===null) {
      setIsFullScreen(false)
    } 
  }

  useEffect(()=>{
    let lastTimeMouseMoved = "";
    let screenElement = document?.getElementById?.('videoContentId');
    if(screenElement){
      screenElement.addEventListener('fullscreenchange', listener);
      screenElement.addEventListener('mousemove', (e)=>{
                
                if(!isFullScreen || !isFullScreenRef?.current){
                  setIsControlsVisible(true)
                }
   
                lastTimeMouseMoved = new Date().getTime();
                if(isFullScreenRef.current){
                var t=setTimeout(function(){
                    var currentTime = new Date().getTime();
                    if(currentTime - lastTimeMouseMoved > 4000){
                      if(document?.elementFromPoint?.(e.clientX, e.clientY)?.getAttribute?.('id')==='videoContentId' || 
                      document?.elementFromPoint?.(e.clientX, e.clientY)?.getAttribute?.('id')==='video-id'){

                          if(isFullScreenRef.current)
                          setIsControlsVisible(false);

                          clearTimeout(t)
                      }
                      
                    }
                },4000)
              }

      });
    }
    
    return ()=>{
      if(screenElement)
      screenElement.removeEventListener('fullscreenchange', listener);
    }
  })

  const playVideo = () => {
    if(document && document.getElementById('video-id')){
      let video = document.getElementById('video-id');
      video.play()
      setVideoPlayStatus('playing')
      if(waveform.current){
        waveform.current.play()

      } 
    }
  }
  const pauseVideo = () => {
    if(document && document.getElementById('video-id')){
      let video = document.getElementById('video-id');
      video.pause()
      setVideoPlayStatus('paused')
      if(waveform.current){
        waveform.current.pause();
      }
      
      
    }
  }

  const onVolumeChange = (e) => {

    let volume = e.target.value;
    let video = document.getElementById('video-id');
    e.target.style.setProperty("--background-size", `${getBackgroundSize(e.target)}%`);
    video.volume = parseFloat(volume)
    setVolume(volume);
    setLastStoredVolume(volume);
    if(volume===0){
      setIsMuted(true)
    }else{
      setIsMuted(false)`  `
    }
  }
  const onFramesZoomChange = (e) => {
    setFrameZoom(e.target.value);

  }
  const toggleMute = () => {
    let volume__local = document.getElementById('volumeId');
    if(!isMuted && parseFloat(volume)>0){
      if(parseFloat(lastStoredVolume)<=0){
        setLastStoredVolume(0.5);
      }
      volume__local.value = 0;
      setVolume(0);
      setIsMuted(true)
    }
    else
    {
      let val = lastStoredVolume;
      if(!parseFloat(val)>0){
        val = 0.5
        setLastStoredVolume(val)
      }
      setVolume(val);
      setIsMuted(false )
      volume__local.value = val;
    }
   
    volume__local.style.setProperty("--background-size", `${getBackgroundSize(volume__local)}%`);
    let video = document.getElementById('video-id');
    video.volume = parseFloat(volume__local.value);
  }
  const FullScreenVideoSize = () => {
    let elem = document.getElementById('videoContentId')
    if(!isFullScreen){
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
      }
      setIsFullScreen(true)
    }
    else{ 
      if(document.fullscreenElement!==null){
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
          document.msExitFullscreen();
        }
      }

      setIsFullScreen(false)
    }

  }
  const onFrameClick = (data, type) => {
    
    setDisplayThumnailFullScreen(`${config.nodeServerUrl}/${data.img}`)
    player.current.muted(true);

    if(type==='startFrames'){
      // alert('called')
      let foundIndex = unselectedFromStart.findIndex((val)=>val.timestamp===data.timestamp);
      let clonedItems = [...unselectedFromStart];
      let itemsToSelect = clonedItems.splice(foundIndex);
      setUnselectedFromStart(clonedItems);
      let frames = [...framesToShow];
      setFramesToShow(itemsToSelect.concat(frames));
      let newStart = lastRequestDetails.start.clone();
      

      // if(unselectedFromStart?.[unselectedFromStart.length-1]?.['timestamp']===data.timestamp){
      //   let cloned = [...unselectedFromStart];
      //   let popedItem = [cloned.pop()]
      //   setUnselectedFromStart(cloned)
      //   let cloned_selected_frames = [...framesToShow];
      //   setFramesToShow(popedItem.concat(cloned_selected_frames));
      //   // setUnselectedFromEnd(popedItem.concat(unselectedFromEnd))
      //   let newDuration = (1000/parseInt(selectedFrameOption.value))/1000
      //   // console.log('***************************8', unselectedFromStart, cloned, popedItem,cloned_selected_frames, framesToShow)
      //   setLastRequestDetails({
      //     ...lastRequestDetails,
      //     duration: parseInt(lastRequestDetails.duration)+newDuration
      //   })
      //   // setDisplayThumnailFullScreen(`${config.nodeServerUrl}/${framesToShow?.[0]?.['img']}`)
      // }
      newStart.subtract('milliseconds',itemsToSelect.length*(1000/parseInt(selectedFrameOption.value)))
      let newDuration = (itemsToSelect.length*(1000/parseInt(selectedFrameOption.value)))/1000
      setLastRequestDetails({
        ...lastRequestDetails,
        start: newStart,
        duration: parseInt(lastRequestDetails.duration)+newDuration
      })

    }
    else if(type==='endFrames'){
      let foundIndex = unselectedFromEnd.findIndex((val)=>val.timestamp===data.timestamp);
      let clonedItems = [...unselectedFromEnd];
      let itemsToSelect = clonedItems.splice(0,foundIndex+1);
      setUnselectedFromEnd(clonedItems);
      let frames = [...framesToShow];
      setFramesToShow(frames.concat(itemsToSelect));
      let newDuration = (itemsToSelect.length*(1000/parseInt(selectedFrameOption.value)))/1000


      // if(unselectedFromEnd?.[0]?.['timestamp']===data.timestamp){
      //   let cloned = [...unselectedFromEnd];
      //   let shiftedItem = [cloned.shift()]
      //   setUnselectedFromEnd(cloned)
      //   let cloned_selected_frames = [...framesToShow];
      //   setFramesToShow(cloned_selected_frames.concat(shiftedItem));
      //   // setUnselectedFromEnd(popedItem.concat(unselectedFromEnd))
      //   let newDuration = (1000/parseInt(selectedFrameOption.value))/1000
      //   console.log('***************************8', unselectedFromEnd, cloned, shiftedItem,cloned_selected_frames, framesToShow)
      //   setLastRequestDetails({
      //     ...lastRequestDetails,
      //     duration: parseInt(lastRequestDetails.duration)+newDuration
      //   })
      //   // setDisplayThumnailFullScreen(`${config.nodeServerUrl}/${framesToShow?.[framesToShow.length-1]?.['img']}`)
      // }

      setLastRequestDetails({
        ...lastRequestDetails,
        duration: parseInt(lastRequestDetails.duration)+parseInt(newDuration)
      })
    }
    else if(type==='selectedFrames'){

      let foundIndex = framesToShow.findIndex((val)=>val.timestamp===data.timestamp);
      let total_selected_frames = framesToShow.length
      let frames_before_current = foundIndex
      let frames_after_current = total_selected_frames - (foundIndex+1)
      if(frames_before_current>frames_after_current){
        // now consider we have to deselect multiple frames at the end.

        let clonedItems = [...framesToShow];
        let itemsToUnSelect = clonedItems.splice(foundIndex);
        setUnselectedFromEnd(itemsToUnSelect.concat(unselectedFromEnd));
        // let frames = [...framesToShow];
        setFramesToShow(clonedItems);

        // let newStart = lastRequestDetails.start.clone();
        // newStart.add('milliseconds',itemsToUnSelect.length*(1000/parseInt(selectedFrameOption.value)))
        
        let newDuration = (itemsToUnSelect.length*(1000/parseInt(selectedFrameOption.value)))/1000
        setLastRequestDetails({
          ...lastRequestDetails,
          // start: newStart,
          duration: parseInt(lastRequestDetails.duration)-newDuration
        })

      }
      else{
        // now consider we have to deselect multiple frames at start

        let clonedItems = [...framesToShow];
        let itemsToUnSelect = clonedItems.splice(0,foundIndex+1);
        setUnselectedFromStart(unselectedFromStart.concat(itemsToUnSelect));
        let frames = [...framesToShow];
        setFramesToShow(clonedItems);

        let newStart = lastRequestDetails.start.clone();
        newStart.add('milliseconds',itemsToUnSelect.length*(1000/parseInt(selectedFrameOption.value)))
        
        let newDuration = (itemsToUnSelect.length*(1000/parseInt(selectedFrameOption.value)))/1000
        setLastRequestDetails({
          ...lastRequestDetails,
          start: newStart,
          duration: parseInt(lastRequestDetails.duration)-newDuration
        })
      }
      // if(framesToShow.length)
      // console.log(framesToShow[foundIndex])

      // if(framesToShow?.[0]?.['timestamp']===data.timestamp){
      //   let cloned = [...framesToShow];
      //   let shiftedItem = [cloned.shift()]
      //   setFramesToShow(cloned);
      //   setUnselectedFromStart(unselectedFromStart.concat(shiftedItem))
      
      // let newStart = lastRequestDetails.start;
      // newStart.add('milliseconds',1000/parseInt(selectedFrameOption.value))
      // let newDuration = (1000/parseInt(selectedFrameOption.value))/1000
      // setLastRequestDetails({
      //   ...lastRequestDetails,
      //   start: newStart,
      //   duration: parseInt(lastRequestDetails.duration)-newDuration
      // })
      // } 
      // else if(framesToShow?.[framesToShow.length-1]?.['timestamp']===data.timestamp){
      //   let cloned = [...framesToShow];
      //   let popedItem = [cloned.pop()]
      //   setFramesToShow(cloned);
      //   setUnselectedFromEnd(popedItem.concat(unselectedFromEnd))
      //   let newDuration = (1000/parseInt(selectedFrameOption.value))/1000
      //   setLastRequestDetails({
      //     ...lastRequestDetails,
      //     duration: parseInt(lastRequestDetails.duration)-newDuration
      //   })
      // }
    }
  }
  const onFrameDropdownSelect = async (option) => {

    setSelectedFrameOption(option)
    setDropdownOpen(false)
    // setFramesToShow([]);
    // setUnselectedFromStart([])
    // setUnselectedFromEnd([])
    // setShowFramesLoader(true);
    // // let frames = await extractFramesFromVideo(`http://office.radioairplay.fm:8086/manage/dvr/export_mp4/nvenc-live/${currentSelectedRecordOnTable.channelSourceUuid}?start=${Math.round(currentSelectedRecordOnTable.dateTime.valueOf()/1000)}&end=${Math.round(currentSelectedRecordOnTable.dateTime.add((parseFloat((currentSelectedRecordOnTable.duration)*1000) + 3000), 'milliseconds').valueOf()/1000)}`, parseInt(option.value), currentSelectedRecordOnTable.dateTime);
    // let frames = await extractFramesFromVideo(`${config.videosBaseUrl}:8081/nvenc-live/${lastRequestDetails.channel}/playlist_dvr_range-${Math.round(currentSelectedRecordOnTable.dateTime.subtract('5000','milliseconds').unix())}-${parseFloat(currentSelectedRecordOnTable.duration)+10}.m3u8`, parseInt(option.value), currentSelectedRecordOnTable.dateTime);
    
    // // setFramesToShow(frames);
    // initializeSelectednUnselectedFrames(frames)
    // setShowFramesLoader(false);

    // setShowFramesLoader(true);
    await generateThumbnails(lastRequestDetails.channel, lastRequestDetails.start.clone().subtract(parseInt(selectedBeforeAfterSecondsFrameOption.current.value)*1000,'milliseconds').unix(),parseInt(parseFloat(lastRequestDetails.duration)+Number(parseInt(selectedBeforeAfterSecondsFrameOption.current.value)*2)), parseInt(option.value))
    // let frames = await extractFramesFromVideo(`http://office.radioairplay.fm:8081/nvenc-live/${selectedSource.channelSourceUuid}/playlist_dvr_range-${selectedSource.dateTime.subtract('3000','milliseconds').unix()}-${parseFloat(selectedSource.duration)+6}.m3u8`, parseInt(selectedFrameOption.value), selectedSource.dateTime);
    // setFramesToShow(frames);
    // if(getThumnailsData){
      // initializeSelectednUnselectedFrames(getThumnailsData)
    // }
    // setShowFramesLoader(false);
    return false;
  }

  const onBeforeAfterSecondsFrameDropdownSelect = async (option) => {

    // setSelectedFrameOption(option)
    console.log(parseInt(option.value),'hhhhhhhhhhhhhhhhhhh')
    setSelectedBeforeAfterSecondsFrameOption(option)
    setBeforeAfterSecondsFrameDropdownOpen(false)
    // setFramesToShow([]);
    // setUnselectedFromStart([])
    // setUnselectedFromEnd([])
    // setShowFramesLoader(true);
    // // let frames = await extractFramesFromVideo(`http://office.radioairplay.fm:8086/manage/dvr/export_mp4/nvenc-live/${currentSelectedRecordOnTable.channelSourceUuid}?start=${Math.round(currentSelectedRecordOnTable.dateTime.valueOf()/1000)}&end=${Math.round(currentSelectedRecordOnTable.dateTime.add((parseFloat((currentSelectedRecordOnTable.duration)*1000) + 3000), 'milliseconds').valueOf()/1000)}`, parseInt(option.value), currentSelectedRecordOnTable.dateTime);
    // let frames = await extractFramesFromVideo(`${config.videosBaseUrl}:8081/nvenc-live/${lastRequestDetails.channel}/playlist_dvr_range-${Math.round(currentSelectedRecordOnTable.dateTime.subtract('5000','milliseconds').unix())}-${parseFloat(currentSelectedRecordOnTable.duration)+10}.m3u8`, parseInt(option.value), currentSelectedRecordOnTable.dateTime);
    
    // // setFramesToShow(frames);
    // initializeSelectednUnselectedFrames(frames)
    // setShowFramesLoader(false);

    // setShowFramesLoader(true);
    if(selectedType==='Radio'){
      setShowAudioSectionLoader(true)
      if(waveform.current){
        waveform.current.destroy();
        waveform.current = false;
      }
      waveform.current = false;
      

      generateAudioChunk(lastRequestDetails.channel, lastRequestDetails.start.clone().subtract(parseInt(option.value)*1000,'milliseconds'), parseInt(parseFloat(lastRequestDetails.duration)+parseInt(option.value)*2))
    }
    else{
      await generateThumbnails(lastRequestDetails.channel, lastRequestDetails.start.clone().subtract(parseInt(option.value)*1000,'milliseconds').unix(),parseInt(parseFloat(lastRequestDetails.duration)+parseInt(option.value)*2), parseInt(selectedFrameOption.value))
    
    }
    
    // let frames = await extractFramesFromVideo(`http://office.radioairplay.fm:8081/nvenc-live/${selectedSource.channelSourceUuid}/playlist_dvr_range-${selectedSource.dateTime.subtract('3000','milliseconds').unix()}-${parseFloat(selectedSource.duration)+6}.m3u8`, parseInt(selectedFrameOption.value), selectedSource.dateTime);
    // setFramesToShow(frames);
    // if(getThumnailsData){
      // initializeSelectednUnselectedFrames(getThumnailsData)
    // }
    // setShowFramesLoader(false);
    return false;
  }
  

  const filterRecords = (contentsFilterValue, searchQuery="", currentSourceItems_ = false) => {
    let newTableItems = [...(currentSourceItems_? currentSourceItems_: currentSourceItems)];
    let newDataSet = [];
    newTableItems.forEach((item)=>{
      
      for(let i in contentsFilterValue) {
        console.log(contentsFilterValue[i], item.category, i, item,'jjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj.....................' ,item.name);
        if((item.category===i && contentsFilterValue[i]?.['value']===true)){
          if(searchQuery!=''){
            console.log('came in ')
            if((item.name?.toLowerCase())?.includes?.(searchQuery.toLowerCase()) || (item.channel?.toLowerCase())?.includes?.(searchQuery.toLowerCase())){
              newDataSet.push(item);
            }
          }
          else{
            newDataSet.push(item);
          }
        }
      }
      

    })
    console.log(newDataSet,'########@@@@@@@@@@@@@!!!!!!!!!!!(((((())))))_________________1111111111111111111111111111111',newTableItems, )
    return newDataSet;
  }

  const onContentsDropSelect = (key, option) =>{
    let newOptionVal = {...currentContentsOptions[key]};
    newOptionVal.value = !newOptionVal.value;
    let allOptions = {...currentContentsOptions};
    allOptions[key] = newOptionVal;
    
    
    let newRecords = filterRecords(allOptions, tableSearchField);
    setFilteredTableItems(newRecords);
    setCurrentContentsOptions(allOptions);
  }

  const if401Logout = (res) => {
    if(res?.status===401){
      // authService.logout();
      setIsLoggedIn(false);
    }
  }
  const onSearch = (e) => {
    let value = e.target.value;
    setTableSearchField(value);
    let newRecords = filterRecords(currentContentsOptions, value);
    setFilteredTableItems(newRecords);
  }
  const fetchBrands = () => {
    setIsBrandLoading(true);
    axios({
      method: 'GET',
      url: config.brandsUrl,
      headers: {
        Authorization: 'Bearer ' + jwtToken.current?.access_token
      }
    }).then((res)=>{
      // if401Logout(res)
      if(res.status===200){
        console.log(res.data);
        if(res?.data?.length){
          setAllBrandOptions(res.data)
          setSpotBrandOptions([])
          let newOptions = [];
          res.data.forEach((val)=>{
            newOptions.push({
              label: val.name,
              value: val.brandUuid
            })
          })
          setBrandOptions(newOptions);
          
        }
        setIsBrandLoading(false);
      }
    }).catch((e)=>{
      console.log(e.message);
      if401Logout(e.response)
      setIsBrandLoading(false);
    })
  }
  const fetchProducts = () => {
    setIsProductLoading(true);
    axios({
      method: 'GET',
      url: config.productsUrl,
      headers: {
        Authorization: 'Bearer ' + jwtToken.current?.access_token
      }
    }).then((res)=>{
      
      if(res.status===200){
        console.log(res.data);
        if(res?.data?.length){
          setAllProductOptions(res.data)
          // let newOptions = [];
          // res.data.forEach((val)=>{
          //   newOptions.push({
          //     label: val.name,
          //     value: val.productUuid
          //   })
          // })
          setProductOptions([]);
          
        }
        setIsProductLoading(false);
      }
    }).catch((e)=>{
      console.log(e.message);
      if401Logout(e.response)
      setIsProductLoading(false);
    })
  }
  const fetchCategories = () => {
    setIsCategoryLoading(true);
    axios({
      method: 'GET',
      url: config.categoriesUrl,
      headers: {
        Authorization: 'Bearer ' + jwtToken.current?.access_token
      }
    }).then((res)=>{
      
      if(res.status===200){
        console.log(res.data);
        if(res?.data?.length){
          setAllCategoryOptions(res.data)
          let newOptions = [];
          res.data.forEach((val)=>{
            newOptions.push({
              label: val.name,
              value: val.spotCategoryUuid
            })
          })
          setCategoryOptions(newOptions);
          
        }
        setIsCategoryLoading(false);
      }
    }).catch((e)=>{
      console.log(e.message);
      if401Logout(e.response)
      setIsCategoryLoading(false);
    })
  }

  const fetchSubCategories = () => {
    setIsSubCategoryLoading(true);
    axios({
      method: 'GET',
      url: config.subCategoriesUrl,
      headers: {
        Authorization: 'Bearer ' + jwtToken.current?.access_token
      }
    }).then((res)=>{
      // if401Logout(res)
      if(res.status===200){
        console.log(res.data);
        if(res?.data?.length){
          setAllSubCategoryOptions(res.data)
          let newOptions = [];
          res.data.forEach((val)=>{
            newOptions.push({
              label: val.name,
              value: val.spotSubCategoryUuid
            })
          })
          setSubCategoryOptions(newOptions);
          
        }
        setIsSubCategoryLoading(false);
      }
    }).catch((e)=>{
      console.log(e.message);
      if401Logout(e.response)
      setIsSubCategoryLoading(false);
    })
  }
  const fetchTags = () => {
    setIsTagLoading(true);
    axios({
      method: 'GET',
      url: config.tagsUrl,
      headers: {
        Authorization: 'Bearer ' + jwtToken.current?.access_token
      }
    }).then((res)=>{
      // if401Logout(res)
      if(res.status===200){
        console.log(res.data);
        if(res?.data?.length){
          setAllTagOptions(res.data)
          let newOptions = [];
          res.data.forEach((val)=>{
            newOptions.push({
              label: val.name,
              value: val.spotTagUuid
            })
          })
          setTagOptions(newOptions);
          
        }
        setIsTagLoading(false);
      }
    }).catch((e)=>{
      console.log(e.message);
      if401Logout(e.response)
      setIsTagLoading(false);
    })
  }
  const fetchSpots = () => {
    setIsSpotLoading(true);
    axios({
      method: 'GET',
      url: config.spotsUrl,
      headers: {
        Authorization: 'Bearer ' + jwtToken.current?.access_token
      }
    }).then((res)=>{
      // if401Logout(res)
      if(res.status===200){
        console.log(res.data);
        if(res?.data?.length){
          setAllSpotOptions(res.data)
          let newOptions = [];
          res.data.forEach((val)=>{
            newOptions.push({
              label: val.name,
              value: val.spotUuid
            })
          })
          setSpotOptions(newOptions);
          
        }
        setIsSpotLoading(false);
      }
    }).catch((e)=>{
      console.log(e.message);
      if401Logout(e.response)
      setIsSpotLoading(false);
    })
  }
  const fetchCompanies = () => {
    setIsCompanyLoading(true);
    axios({
      method: 'GET',
      url: config.companiesUrl,
      headers: {
        Authorization: 'Bearer ' + jwtToken.current?.access_token
      }
    }).then((res)=>{
      // if401Logout(res)
      if(res.status===200){
        console.log(res.data);
        if(res?.data?.length){
          let newOptions = [];
          res.data.forEach((val)=>{
            newOptions.push({
              label: val.name,
              value: val.companyUuid
            })
          })
          setCompanyOptions(newOptions);
        }
        setIsCompanyLoading(false);
      }
    }).catch((e)=>{
      console.log(e.message);
      if401Logout(e.response)
      setIsCompanyLoading(false);
    })
  }
  const playVideoAccordingToFrames = () => {
    let start = lastRequestDetails.start;
    let duration = lastRequestDetails.duration;
    let channel = lastRequestDetails.channel;
    // if(framesToShow.length){
    //   if(parseInt(selectedFrameOption.value)===2){
    //     duration = parseInt(framesToShow.length/2)
    //   }
    //   else if(parseInt(selectedFrameOption.value)===4){
    //     duration = parseInt(framesToShow.length/4)
    //   }
      
    // }
    // let channel;
    // get channel 
    // if(currentSelectedRecordOnTable?.channelSourceUuid){
    //   channel = currentSelectedRecordOnTable?.channelSourceUuid;
    // }
    // else if(selectedChannel.value && datePickerValue){
    //   channel = selectedChannel.value
    // }
    if(channel){
      setDisplayThumnailFullScreen(null)
      player.current.src({

        src: `http://office.radioairplay.fm:8081/nvenc-live/${channel}/playlist_dvr_range-${start.unix()}-${duration}.m3u8`,
        type: 'application/x-mpegURL', 
      });

    }

  }

  const selectUnselectTableItem = (val, key) => {
    key = itemOffset + key;
    let filteredItems = [...filteredTableItems];
    if(val===true){
      // first unselect all other then select the current one
      let newFilteredItems = [];
      filteredItems.forEach((innerVal)=>{
        let item = {...innerVal}
        item.isSelected = false;
        newFilteredItems.push(item)
      })

      newFilteredItems[key]['isSelected'] = val;
      
      console.log('#######################################',newFilteredItems[key])
      setDisplayThumnailFullScreen(false)
      player?.current?.muted?.(false);
      setFilteredTableItems(newFilteredItems);
      setCurrentSelectedRecordOnTable(newFilteredItems[key])
      if(selectedType==='Radio'){
        playAudio(newFilteredItems[key])
      }
      else{
        playVideoAndGetFrames(newFilteredItems[key]);
      }
      
    }else{
      // don't do anything
    }
    
  }

  const getBackgroundSize = (input) => {
    const min = +input.min || 0;
    const max = +input.max || 100;
    const value = +input.value;
  
    const size = (value - min) / (max - min) * 100;
  
    return size;
  }

  const onDatePickerChange = (date) => {
    // console.log(date.format('DD/MM/YYYY HH:mm:ss:SSS'), moment.subtract(50,'seconds').format('DD/MM/YYYY HH:mm:ss:SSS'), date.isBefore(moment.subtract(50,'seconds')))
    if(date.isBefore(moment().subtract(50,'seconds'))){
      setDatePickerValue(date);
    }
    else{
      alert('date should be minimum 50 seconds older than now');
      setDatePickerValue(moment().subtract(50,'seconds'));
    }
    
  }
  const onPlayPress = () => {
    console.log(selectedChannel, datePickerValue)
    if(datePickerValue && selectedChannel?.value){
      console.log('hello')
      if(selectedType==='Radio'){
        playAudio({
          dateTime: moment.utc(datePickerValue),
          channelSourceUuid: selectedChannel.value,
          duration: 40,
          dateTimeToShow: datePickerValue
        })
      }
      else{
        playVideoAndGetFrames({
          dateTime: moment.utc(datePickerValue),
          channelSourceUuid: selectedChannel.value,
          duration: 40,
          dateTimeToShow: datePickerValue
        })
      }

    }
  }
  const volumeSizes = { 
      '0': <ImVolumeMute2/>,
      '0.25': <ImVolumeLow />,
      '0.50': <ImVolumeMedium />,
      '1': <ImVolumeHigh />
    }

    const beforeAfterNumberOfFramesDropOptions = [
      {
        value: '3',
        label: '3 seconds before after'
      },
      {
        value: '5',
        label: '5 seconds before after'
      },
      {
        value: '10',
        label: '10 seconds before after'
      },
      {
        value: '15',
        label: '15 seconds before after'
      }
    ]

  const frameDropOptions = [
    {
      value: '1',
      label: '1 Frame per second'
    },
    {
      value: '2',
      label: '2 Frame per second'
    },
    {
      value: '4',
      label: '4 Frame per second'
    },
    {
      value: '5',
      label: '5 Frame per second'
    },
    {
      value: '10',
      label: '10 Frame per second'
    }
  ]
  const frameZoomValues = {
    50: 0,
    40: -10,
    30: -20,
    20: -30,
    10: -40,
    0:-50,
    60: 10,
    70: 20,
    80: 30,
    90: 40,
    100: 50 
  }

  const handleFingerprint = () => {
    setFingerprintModalOpen(true)
    // alert(lastRequestDetails?.selectedSource?.isRecognition);
    if(lastRequestDetails?.selectedSource?.isRecognition){
      

      // alert('it is a recognition')
    }else{
      // alert('not a recognition')
      fetchCompanies();
      fetchBrands();
      fetchProducts();
      fetchCategories();
      fetchSubCategories();
      fetchTags();
      fetchSpots();
    }

    
  }

  useEffect(() => {
    // Fetch items from another resources.
    const endOffset = itemOffset + itemsPerPage;
    console.log(`Loading filteredTableItems from ${itemOffset} to ${endOffset}`);
    let newFilteredTableItems = [...filteredTableItems]
    setCurrentTableItems(newFilteredTableItems.slice(itemOffset, endOffset));
    setPageCount(Math.ceil(newFilteredTableItems.length / itemsPerPage));
    console.log('filteredTableItems changed', newFilteredTableItems)
  }, [itemOffset, itemsPerPage, filteredTableItems]);

  const handlePageClick = (event) => {
    const newOffset = event.selected * itemsPerPage % filteredTableItems.length;
    console.log(`User requested page number ${event.selected}, which is offset ${newOffset}`);
    setItemOffset(newOffset);
  };

  const onCompanyChange = (val) => {

    setSelectedCompany(val);
    setProductOptions([])
    setSpotBrandOptions([]);
    handleAddModalTypeChange({}, addModalOpen, 'product')
    setSelectedBrand({})
    let newOptions = []
    allBrandOptions.forEach((value)=>{
      if(value.companyUuid===val.value){
        newOptions.push({
          label: value.name,
          value: value.brandUuid
        })
        // newOptions.push(value);
      }
    })
    console.log(newOptions,'___________________________________________', allBrandOptions, val)
    setSpotBrandOptions(newOptions);
    
  }

  const onBrandsChange = (val) => {

    console.log(val,'&&&&&&&&&&HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHEEEEELLLLLLLLLLLLLLLLLLOOOOOOOOO')
    setSelectedBrand(val);
    setProductOptions([])
    handleAddModalTypeChange({}, addModalOpen, 'product')
    
    let newOptions = []
    allProductOptions.forEach((value)=>{
      if(value.brandUuid===val.value){
        newOptions.push({
          label: value.name,
          value: value.productUuid
        })
        // newOptions.push(value);
      }
    })
    console.log(newOptions,'___________________________________________', allProductOptions, val)
    setProductOptions(newOptions);
    
  }

  
  const onProductsChange = (val) => {

    setSelectedProduct(val);
    // let newOptions = []
    // allProductOptions.forEach((value)=>{
    //   if(value.brandUuid===val.value){
    //     newOptions.push({
    //       label: value.name,
    //       value: value.productUuid
    //     })
    //     // newOptions.push(value);
    //   }
    // })
    // console.log(newOptions,'___________________________________________', allProductOptions, val)
    // setProductOptions(newOptions);
    
  }
  const onCategoriesChange = (val) =>{
    setSelectedCategory(val);
    let newOptions = []
    allSubCategoryOptions.forEach((value)=>{
      if(value.spotCategoryUuid===val.value){
        newOptions.push({
          label: value.name,
          value: value.spotSubCategoryUuid
        })
        // newOptions.push(value);
      }
    })
    console.log(newOptions,'___________________________________________', allSubCategoryOptions, val)
    setSubCategoryOptions(newOptions);
  }
  const onSubCategoriesChange = (val) =>{
    setSelectedSubCategory(val);
  }

  // get table data
  const getChannelName = (sourceUuid) =>{
    console.log(allSources.current,'**********************************')
    let getSourceName = [...allSources.current];
    let name = getSourceName.filter((val)=>val.sourceUuid===sourceUuid)
    return name?.length?name?.[0]?.name:''
  }
  const parseRecognitionsTableData = (data) => {
    let newData = [...newlyFetchedTableData.current];
    data.forEach((val)=>{
      let sourcespotversion = val.sourceSpotversion;
      let spotversion = val.spotversion;
      let isSelected = false;
      if(newData.length===0){
        isSelected = true;
      }
      let epgName = 'N/A';
      if(val?.epgProgram?.name){
        epgName = val?.epgProgram?.name;
      }
      newData.push({
        category: 'RECOGNIZED_SV',
        isSelected,
        isVerified: true,
        dateTime: moment(sourcespotversion.startTimestampUtc),
        dateTimeToShow: false,
        channel:  getChannelName(sourcespotversion.sourceUuid), // channel name
        type: 'RECOGNIZED_SV',
        duration: null,
        matching: Math.round(sourcespotversion.playDuration),
        name: spotversion.name,
        program: epgName,
        channelSourceUuid: String(sourcespotversion.sourceUuid).toUpperCase(),
        data: val,
        isRecognition: true
      })

    })
    setNewlyFetchedTableData(newData);
    return newData;
  }
  const parseProposalsTableData = (data) => {
    let newData = [...newlyFetchedTableData.current];
    data.forEach((val)=>{

      let isSelected = false;
      if(newData.length===0){
        isSelected = true;
      }
      let epgName = 'N/A';
      // if(val?.epgProgram?.name){
      //   epgName = val?.epgProgram?.name;
      // }
      if(val.typeCode===2){
        console.log(val,'iiiiiiiiiiiiiiiiiiiiiiiOOOOOOOOOOOOOOOOOOOOOOOOOOO((((((((((((********&&&&&^')
        newData.push({
          category: 'PROPOSED_SV',
          isSelected,
          isVerified: false,
          dateTime: moment.utc(val.startTimestampUtc).tz("Europe/Rome"),
          dateTimeToShow: moment.utc(val.startTimestampUtc).tz("Europe/Rome"),
          channel:  getChannelName(val.sourceUuid), // channel name
          type: 'PROPOSED_SV',
          duration: Math.round(moment(val.endTimestampUtc).diff(val.startTimestampUtc,'seconds')),
          matching: null ,
          name: null,
          program: epgName,
          channelSourceUuid: String(val.sourceUuid).toUpperCase(),
          data: val,
          isRecognition: false
        })
      }


    })
    setNewlyFetchedTableData(newData);
    return newData;
  }

  const handleNotRecognitionFingerprintSave = () => {
    if(!lastRequestDetails?.selectedSource?.isRecognition && typeName && selectedSpot?.value){

      if(selectedType==='Radio'){
             
        let current_region = (Object.values(waveform?.current?.regions?.list))[0];
        let start_audio = current_region['start']
        let end_audio = current_region['end']
      
        let spotUuid = lastRequestDetails?.selectedSource?.data?.spot?.spotUuid;
        saveAudioFingerprintDetails(loadedAudioFile, start_audio, end_audio, spotUuid, typeName)
    
      }
      else{
        let start_frame_moment = moment(framesToShow?.[0]?.timestamp);
        // let start_utc = moment(framesToShow?.[0]?.timestamp)
        let zero_zero_time = moment().startOf('day')
        let start_cut = zero_zero_time.add(parseInt(start_frame_moment.format('SSS')), 'milliseconds').format('HH:mm:ss.SSS')
        let end_cut = zero_zero_time.clone().add(parseFloat(framesToShow.length/parseInt(selectedFrameOption?.value))*1000, 'milliseconds').format('HH:mm:ss.SSS')
        let last_frame_moment = moment(framesToShow?.[framesToShow.length-1]?.timestamp);
        
        let channel = lastRequestDetails.channel;
        let start_utc = start_frame_moment.unix();
        let duration = parseInt(last_frame_moment.diff(start_frame_moment,'seconds'))+2;
        let spotUuid = selectedSpot.value;
        saveFingerprintDetails(channel, start_utc, duration, start_cut, end_cut, spotUuid, typeName)
      }
    }
    else {
      alert('please select or add a valid value for spot and spotversion name')
    }
  }

  const signin = () => {
    authService.login();
  }


  const handleFingerprintSave = () => {
    // console.log(lastRequestDetails,'test it ma', spotVersionName)
    if(lastRequestDetails?.selectedSource?.isRecognition && spotVersionName){

      if(selectedType==='Radio'){
             
        let current_region = (Object.values(waveform?.current?.regions?.list))[0];
        let start_audio = current_region['start']
        let end_audio = current_region['end']
      
        let spotUuid = lastRequestDetails?.selectedSource?.data?.spot?.spotUuid;
        saveAudioFingerprintDetails(loadedAudioFile, start_audio, end_audio, spotUuid, spotVersionName)
    
      }
      else{

        let start_frame_moment = moment(framesToShow?.[0]?.timestamp);
        // let start_utc = moment(framesToShow?.[0]?.timestamp)
        let zero_zero_time = moment().startOf('day')
        let start_cut = zero_zero_time.add(parseInt(start_frame_moment.format('SSS')), 'milliseconds').format('HH:mm:ss.SSS')
        let end_cut = zero_zero_time.clone().add(parseFloat(framesToShow.length/parseInt(selectedFrameOption?.value))*1000, 'milliseconds').format('HH:mm:ss.SSS')
        let last_frame_moment = moment(framesToShow?.[framesToShow.length-1]?.timestamp);
        
        let channel = lastRequestDetails.channel;
        let start_utc = start_frame_moment.unix();
        let duration = parseInt(last_frame_moment.diff(start_frame_moment,'seconds'))+2;
        let spotUuid = lastRequestDetails?.selectedSource?.data?.spot?.spotUuid;
        saveFingerprintDetails(channel, start_utc, duration, start_cut, end_cut, spotUuid, spotVersionName)
      
      }
      
    }else{
      alert('invalid spotversion name')
    }
  }

  const handleCustomFingerprintSave = async () => {
    console.log(typeStates,'hhhhhhhhhhhhheeeeeeeeeeeeeeeeeellllllllllllllllooooooooooo')
    if(addModalOpen==='company'){
      await saveCompany();
      setAddModalOpen(false);
      setFingerprintModalOpen(true);
    }
    else if(addModalOpen==='brand'){
      await saveBrand();
      setAddModalOpen(false);
      setFingerprintModalOpen(true);
    }
    else if(addModalOpen==='product'){
      await saveProduct();
      setAddModalOpen(false);
      setFingerprintModalOpen(true);
    }
    else if(addModalOpen==='category'){
      await saveCategory();
      setAddModalOpen(false);
      setFingerprintModalOpen(true);
    }
    else if(addModalOpen==='subcategory'){
      await saveSubCategory();
      setAddModalOpen(false);
      setFingerprintModalOpen(true);
    }
    else if(addModalOpen==='tag'){
      await saveTag();
      setAddModalOpen(false);
      setFingerprintModalOpen(true);
    }
    else if(addModalOpen==='spot'){
      await saveSpot();
      setAddModalOpen(false);
      setFingerprintModalOpen(true);
    }
  }
  const saveCompany = async () => {
    let newTypeStates = {...typeStates}

    let newData = {
      companyUuid: uuid(),
      name: newTypeStates.company.name,
      url: "",
      modifiedUtc: moment().toDate(),
      details: ""
    }

    return new Promise(async (resolve, reject) => {
      try{
        let res = await axios({
          method: 'POST',
          url: `${config.companiesUrl}`,
          data: newData,
          json: true,
          headers: {
            Authorization: 'Bearer ' + jwtToken.current?.access_token
          }
        })
        // if401Logout(res)
        if(res.status ===201 || res.status===200){
          console.log(res.data,'___________++++++++++++++++++++++++++++++++++++++++++++++++++++++')
          // let da = parseProposalsTableData(res.data)
          resolve(res.data);
          // ;
        }
      }
      catch(e){
        if401Logout(e.response)
        console.log(e.message);
        reject(e.message)
      }
    })


  }
  const saveBrand = async () => {
    let newTypeStates = {...typeStates}

    let newData = {
      brandUuid: uuid(),
      companyUuid: newTypeStates?.brand?.company?.value,
      name: newTypeStates?.brand?.name,
      modifiedUtc: moment().toDate(),
      details: ""
    }

    return new Promise(async (resolve, reject) => {
      try{
        let res = await axios({
          method: 'POST',
          url: `${config.brandsUrl}`,
          data: newData,
          json: true,
          headers: {
            Authorization: 'Bearer ' + jwtToken.current?.access_token
          }
        })
        // if401Logout(res)
        if(res.status ===201 || res.status===200){
          console.log(res.data,'___________++++++++++++++++++++++++++++++++++++++++++++++++++++++')
          // let da = parseProposalsTableData(res.data)
          resolve(res.data);
          // ;
        }
      }
      catch(e){
        if401Logout(e.response)
        console.log(e.message);
        reject(e.message)
      }
    })


  }
  const saveProduct = async () => {
    let newTypeStates = {...typeStates}

    let newData = {
      productUuid: uuid(),
      brandUuid: newTypeStates?.product?.brand?.value,
      name: newTypeStates?.product?.name,
      modifiedUtc: moment().toDate(),
      details: ""
    }

    return new Promise(async (resolve, reject) => {
      try{
        let res = await axios({
          method: 'POST',
          url: `${config.productsUrl}`,
          data: newData,
          json: true,
          headers: {
            Authorization: 'Bearer ' + jwtToken.current?.access_token
          }
        })
        // if401Logout(res)
        if(res.status ===201 || res.status===200){
          console.log(res.data,'___________++++++++++++++++++++++++++++++++++++++++++++++++++++++')
          // let da = parseProposalsTableData(res.data)
          resolve(res.data);
          // ;
        }
      }
      catch(e){
        if401Logout(e.response)
        console.log(e.message);
        reject(e.message)
      }
    })


  }
  const saveCategory = async () => {
    let newTypeStates = {...typeStates}

    let newData = {
      spotCategoryUuid: uuid(),
      name: newTypeStates.category.name,
      details: ""
    }

    return new Promise(async (resolve, reject) => {
      try{
        let res = await axios({
          method: 'POST',
          url: `${config.categoriesUrl}`,
          data: newData,
          json: true,
          headers: {
            Authorization: 'Bearer ' + jwtToken.current?.access_token
          }
        })
        // if401Logout(res)
        if(res.status ===201 || res.status===200){
          console.log(res.data,'___________++++++++++++++++++++++++++++++++++++++++++++++++++++++')
          // let da = parseProposalsTableData(res.data)
          resolve(res.data);
          // ;
        }
      }
      catch(e){
        if401Logout(e.response)
        console.log(e.message);
        reject(e.message)
      }
    })


  }
  const saveSubCategory = async () => {
    let newTypeStates = {...typeStates}

    let newData = {
      spotSubCategoryUuid: uuid(),
      spotCategoryUuid: newTypeStates?.subcategory?.category?.value,
      name: newTypeStates?.subcategory?.name,
      details: ""
    }

    return new Promise(async (resolve, reject) => {
      try{
        let res = await axios({
          method: 'POST',
          url: `${config.subCategoriesUrl}`,
          data: newData,
          json: true,
          headers: {
            Authorization: 'Bearer ' + jwtToken.current?.access_token
          }
        })
        // if401Logout(res)
        if(res.status ===201 || res.status===200){
          console.log(res.data,'___________++++++++++++++++++++++++++++++++++++++++++++++++++++++')
          // let da = parseProposalsTableData(res.data)
          resolve(res.data);
          // ;
        }
      }
      catch(e){
        if401Logout(e.response)
        console.log(e.message);
        reject(e.message)
      }
    })


  }
  const saveTag = async () => {
    let newTypeStates = {...typeStates}

    let newData = {
      spotTagUuid: uuid(),
      name: newTypeStates.tag.name,
      details: ""
    }

    return new Promise(async (resolve, reject) => {
      try{
        let res = await axios({
          method: 'POST',
          url: `${config.tagsUrl}`,
          data: newData,
          json: true,
          headers: {
            Authorization: 'Bearer ' + jwtToken.current?.access_token
          }
        })
        // if401Logout(res)
        if(res.status ===201 || res.status===200){
          console.log(res.data,'___________++++++++++++++++++++++++++++++++++++++++++++++++++++++')
          // let da = parseProposalsTableData(res.data)
          resolve(res.data);
          // ;
        }
      }
      catch(e){
        if401Logout(e.response)
        console.log(e.message);
        reject(e.message)
      }
    })


  }
  const saveSpot = async () => {
    let newTypeStates = {...typeStates}

    let newData = {
      spotUuid: uuid(),
      productUuid: newTypeStates?.spot?.product?.value,
      spotSubCategoryUuid: newTypeStates?.spot?.subcategory?.value,
      spotTagUuid: newTypeStates?.spot?.tag?.value,
      name: newTypeStates?.spot?.name,
      isPlayed: true,
      modifiedUtc: moment().toDate(),
      details: ""
    }

    return new Promise(async (resolve, reject) => {
      try{
        let res = await axios({
          method: 'POST',
          url: `${config.spotsUrl}`,
          data: newData,
          json: true,
          headers: {
            Authorization: 'Bearer ' + jwtToken.current?.access_token
          }
        })
        // if401Logout(res)
        if(res.status ===201 || res.status===200){
          console.log(res.data,'___________++++++++++++++++++++++++++++++++++++++++++++++++++++++')
          // let da = parseProposalsTableData(res.data)
          fetchSpots();
          resolve(res.data);
          // ;
        }
      }
      catch(e){
        if401Logout(e.response)
        console.log(e.message);
        reject(e.message)
      }
    })


  }
  const saveAudioFingerprintDetails = async (filename, start, end, spotUuid, spotversion=false) => {
    return new Promise(async (resolve, reject) => {
      try{
        let res = await axios({
          method: 'POST',
          url: config.saveAudioFingerprintUrl,
          data: {
            filename,
            start,
            end,
            spotVersionName: spotversion,
            spotUuid
          },
          headers: {
            Authorization: 'Bearer ' + jwtToken.current?.access_token
          }
        })
        // if401Logout(res)
        if(res.status ===200){
          console.log(res.data,'___________++++++++++++++++++++++++++++++++++++++++++++++++++++++')
          // let da = parseProposalsTableData(res.data)
          resolve(res.data);
          // ;
        }
      }
      catch(e){
        if401Logout(e.response)
        console.log(e.message);
        reject(e.message)
      }
    })


  }
  const saveFingerprintDetails = async (channel, start_utc, duration, start_cut, end_cut, spotUuid, spotversion=false) => {
    return new Promise(async (resolve, reject) => {
      try{
        let res = await axios({
          method: 'POST',
          url: config.saveFingerprintUrl,
          data: {
            channel,
            start_utc,
            duration,
            start_cut,
            end_cut,
            spotVersionName: spotversion,
            spotUuid
          },
          headers: {
            Authorization: 'Bearer ' + jwtToken.current?.access_token
          }
        })
        // if401Logout(res)
        if(res.status ===200){
          console.log(res.data,'___________++++++++++++++++++++++++++++++++++++++++++++++++++++++')
          // let da = parseProposalsTableData(res.data)
          resolve(res.data);
          // ;
        }
      }
      catch(e){
        if401Logout(e.response)
        console.log(e.message);
        reject(e.message)
      }
    })


  }

  const fetchProposals = async (source, start, end) => {
    return new Promise(async (resolve, reject) => {
      try{
        let res = await axios({
          method: 'GET',
          url: `${config.proposalsUrl}?sourceUuid=${source}&startTimestampUtc=${start}&endTimestampUtc=${end}`,
          headers: {
            Authorization: 'Bearer ' + jwtToken.current?.access_token
          }
        })
        // if401Logout(res)
        if(res.status ===200){
          console.log(res.data,'___________++++++++++++++++++++++++++++++++++++++++++++++++++++++')
          let da = parseProposalsTableData(res.data)
          resolve(da);
          // ;
        }
      }
      catch(e){
        if401Logout(e.response)
        console.log(e.message);
        reject(e.message)
      }
    })


  }
  const fetchRecognitions = async (source, start, end, diff) => {
    return new Promise(async (resolve, reject) => {
      try{
        let res = await axios({
          method: 'GET',
          url: `${config.recognitionsUrl}?sourceUuid=${source}&startTimestampUtc=${start}&endTimestampUtc=${end}&minDurationDifference=${diff}`,
          headers: {
            Authorization: 'Bearer ' + jwtToken.current?.access_token
          }
        })
        // if401Logout(res)
        if(res.status ===200){
          console.log(res.data,'___________++++++++++++++++++++++++++++++++++++++++++++++++++++++')
          let da = parseRecognitionsTableData(res.data)
          resolve(da);
          // ;
        }
      }
      catch(e){
        if401Logout(e.response)
        console.log(e.message);
        reject(e.message)
      }
    })


  }

  const radioClickHandler = (__selectedType) => {
    setSelectedType(__selectedType)
    
    // here we process data according to type selected like TV or RADIO
    // let dataHolder = __selectedType==='Tv'?availableTvChannels: availableRadioChannels
    console.log(allSources.current,'iiiiiiiiiiiiiiiiioooooooooooooooooooooooooooooopppppppppppppppppp')
    getTableRowsData(allSources.current, __selectedType);
    // console.log('#############################', availableRadioChannels, dataHolder,__selectedType,availableTvChannels)
    // if(dataHolder.length>0){
    //   setMultiSelectedChannel([dataHolder[0]])
    //   handleFetchClick([dataHolder[0]]);
    // }else{
    //   setMultiSelectedChannel([])
    //   // set
    // }
    // setChannelsDropdown(dataHolder);
    

  }


  const handleFetchClick = async (newmultiSelected=false, __selected_type=false) => {
    newmultiSelected = newmultiSelected || multiSelectedChannel;
    __selected_type = __selected_type || selectedType
    setCurrentSourceItems([]);
    setFilteredTableItems([])
    setNewlyFetchedTableData([]);
    // setTimeout(async ()=>{
      
      console.log(newmultiSelected,'((((((((((((((((((((((((((((((((((((((')
      let datetime = moment.utc();
      let start = encodeURIComponent(datetime.clone().subtract(10, 'days').format('YYYY-MM-DDTHH:mm:ss.SSS'));
      let end = encodeURIComponent(datetime.format('YYYY-MM-DDTHH:mm:ss.SSS'))
      let diff = 1;
      setIsTabledataLoading(true);
      for(let i =0; i<newmultiSelected.length;i++){
        console.log('before await', i)
        let recognitions = await fetchRecognitions(newmultiSelected[i].value, start, end, diff);
        let proposals = await fetchProposals(newmultiSelected[i].value, start, end);
        console.log('after await', i)
        if(i===(newmultiSelected.length-1) && newlyFetchedTableData.current?.length){
          setIsTabledataLoading(false);
          // let newlyFetchedTableData = newlyFetchedTableData.current;
          console.log(newlyFetchedTableData.current,'')
          setCurrentSourceItems(newlyFetchedTableData.current);
              
          let newRecords = filterRecords(currentContentsOptions, tableSearchField, newlyFetchedTableData.current);
    // setFilteredTableItems(newRecords);
          setFilteredTableItems(newRecords)
          if(newRecords.length>0){
            let firstSelectedItem = newRecords[0];
            setCurrentSelectedRecordOnTable(firstSelectedItem)
            if(__selected_type==='Radio'){
              playAudio(firstSelectedItem)
            }
            else{
              playVideoAndGetFrames(firstSelectedItem);
            }
          }
          
        }
      }
    // },1000)



  }

  const handleAddModal = (type) => {
    
    if(type==='brand'){
      fetchCompanies();
    }
    else if( type==='product'){
      fetchBrands();
    }
    else if( type==='subcategory'){
      fetchCategories();
    }
    else if(type==='spot'){
      fetchProducts();
      fetchSubCategories();
      fetchTags();
    }
    
    setAddModalOpen(type)
    setFingerprintModalOpen(false);
    console.log(type, addModalOpen)
  }

  const handleAddModalTypeChange = (val, type, subtype) => {

    let types = {...typeStates};

    types[type][subtype] = val;
    setTypeStates(types);
  }
  return !isLoggedIn? (
    <div className='w-screen h-screen align-middle text-center grid place-items-center bg-black'>
      <div className=' border-white rounded-md p-20 border-2 text-white'>
          <span>Sign in to the application</span>
          <br/>
          <button className=' bg-blue-500 rounded-md p-3 pr-6 pl-6 mt-5 text-white' onClick={signin}>Login</button>
      </div>

    </div>
  ):(
    <div className="App-class pt-2 pl-10 pr-10 h-full pb-32 text-white grid gap-0 grid-flow-row grid-rows-outer-section">
      <header className="grid grid-flow-col h-30 border-b-2 grid-cols-top-header header pl-3 pr-6 max-h-48">
        <div style={{color:'initial'}} className='relative' id="ChannelsSelector">
          <img alt="logo" src="imgs/player-logo.png"  className=" h-12 self-center absolute top-7" onClick={()=>setShowChannelsDropdown(!showChannelsDropdown)}/>
          {          
             (
            <div className={`absolute top-20 w-96 z-1100 ${showChannelsDropdown?'':'hidden'}`}>
              <Select
                className="basic-single"
                classNamePrefix="select"
                // defaultValue={colourOptions[0]}
                isDisabled={false}
                isLoading={false}
                isClearable={true}
                isRtl={false}
                isSearchable={true}
                name="color"
                options={channelsDropdown}
                onChange={(val)=>setSelectedChannel(val)}
                // onSelectResetsInput = {false}
              />
            </div>
            )
          }
        </div>
        <div className="grid grid-flow-col grid-cols-play-pause">
            {/* <Clock /> */}
            <div style={{color:'initial'}}>
                <DatetimePicker onChange={onDatePickerChange} isValidDate={( current, selected ) => {
                      let before50seconds = moment().subtract(60,'seconds');
                      return current.isBefore( before50seconds );
                  }} 
                  className='tracking-wider grid grid-flow-col w-96 clock self-center mt-6 text-center' 
                  utc={false} timeFormat="hh:mm:ss A" 
                  value={datePickerValue} 
                />
            </div>
            <div className="grid grid-flow-col justify-start self-center">
                <div className="play-stop border-2 mr-1 pl-5 pr-5 cursor-pointer" onClick={onPlayPress}>
                    <BiPlay size="30"/>
                </div>
                <div className="play-stop border-2 text-white" onClick={()=>{console.log((Object.values(waveform?.current?.regions?.list))[0].end,'888888888888888888')}}>
                    <BiStop size="30" />
                </div>

                {/* <div className="play-stop border-2 text-white pl-2 pr-2 ml-3 cursor-pointer" onClick={playVideoAccordingToFrames}>
                    Apply frames to video
                </div> */}
                <div className="play-stop border-2 text-white pl-2 pr-2 ml-3 cursor-pointer" onClick={convertNDownloadFile}>
                    {
                      showExportLoader?(<span ><BiLoaderAlt className='pt-1 rotating' size="30" /></span>):'Export'
                    } 
                </div>
                
            </div>
        </div>
        
        <div className="grid grid-flow-col justify-end self-center">
                <div className={`${selectedType==='Radio'?'radio-tv-selected-tab':''} text-white p-2 pl-5 pr-5 cursor-pointer`} onClick={()=>radioClickHandler('Radio')}> 
                    RADIO
                </div>
                <div className={`${selectedType==='Tv'?'radio-tv-selected-tab':''} text-white p-2 pl-8 pr-8 cursor-pointer`} onClick={()=>radioClickHandler('Tv')}>
                    TV
                </div>
            </div>
      </header>
      <main >
        {
          selectedType==='Radio'?(
            <>

        <div className="w-full mt-2" >
          
              <div style={{width:'100%', maxWidth:'100%',height:'250px'}}>
                  {
                    showAudioSectionLoader?(
                      <div className='text-center relative text-blue-600' style={{height:'250px'}}>
                        <span className='absolute top-2/4 inline-block'><span className='-ml-14 inline-block'>Loading...</span> <span className='text-center rotating inline-block'><BiLoaderAlt className='rotating' size="40"/></span></span>
                      </div>
                    ):(
                      <div id="waveform">

                        </div> 
                    )
                  }
              {/* <Scrollbars className="max-w-full max-h-full text-white p-3 mt-3" 
              renderThumbHorizontal={props => <div {...props} className=" scrolbar-thumb"/>}
              renderThumbVertical={props => <div {...props} className=" scrolbar-thumb"/>}
              > */}
                                   
                  

              {/* </Scrollbars> */}
              
              </div>
              {/* <div id="waveform" style={{width:'1600px',overflow:'scroll'}}>

              </div> */}
        </div>
        <div id="timeline"></div>
        <div className={`inline-block slidecontainer w-20 inline__ mb-2 self-center`}>
                <input type="range" min={20} max={500} defaultValue={20} step={20} id="waveformZoomId" className="slider__generic w-24 cursor-pointer"/>
        </div>
            </>
          ):(
            <div className="table-with-video h-96 grid grid-cols-video-section">
            {
              showFramesLoader? (
                <div className='text-center relative' >
                  <span className='absolute top-2/4 inline-block'><span className='-ml-14'>Creating thumbnails...</span> <span className='text-center rotating'><BiLoaderAlt className='rotating' size="40"/></span></span>
                </div>
              ):(
                <Scrollbars className="table-content justify-start text-left pl-5 max-h-full"> 
                {
                  unselectedFromStart?.map((data)=>{
                    return (
                      <div key={data.time} id="framesDiv" style={{width: `${112+parseInt(frameZoomValues[frameZoom])}px`, height:`${96+parseInt(frameZoomValues[frameZoom])}px`}} className={`inner-element text-center pt-3 w-28 ml-3 h-24 opacity-30`} onClick={()=>onFrameClick(data, 'startFrames')}>
                        <img src={`${config.nodeServerUrl}/${data.img}`} className="w-full h-full border-2 border-black"/>
                        <span className=" text-xs more-small-text">{lastRequestDetails.convertToLocal?moment.utc(moment(data.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')).tz('Europe/Rome').format('HH:mm:ss.SSS') : data.time}</span>
                      </div>
                    )
                  })
                }
                {
                  framesToShow.map((data)=>{
                    return (
                      <div key={data.time} id="framesDiv" style={{width: `${112+parseInt(frameZoomValues[frameZoom])}px`, height:`${96+parseInt(frameZoomValues[frameZoom])}px`}} className={`inner-element text-center pt-3 w-28 ml-3 h-24`} onClick={()=>onFrameClick(data, 'selectedFrames')}>
                        <img src={`${config.nodeServerUrl}/${data.img}`} className="w-full h-full border-2 border-black"/>
                        <span className=" text-xs more-small-text">{lastRequestDetails.convertToLocal?moment.utc(moment(data.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')).tz('Europe/Rome').format('HH:mm:ss.SSS') : data.time}</span>
                      </div>
                    )
                  })
                }
                {
                  unselectedFromEnd?.map((data)=>{
                    return (
                      <div key={data.time} id="framesDiv" style={{width: `${112+parseInt(frameZoomValues[frameZoom])}px`, height:`${96+parseInt(frameZoomValues[frameZoom])}px`}} className={`inner-element text-center pt-3 w-28 ml-3 h-24 opacity-30`} onClick={()=>onFrameClick(data, 'endFrames')}>
                        <img src={`${config.nodeServerUrl}/${data.img}`} className="w-full h-full border-2 border-black"/>
                        <span className=" text-xs more-small-text">{lastRequestDetails.convertToLocal?moment.utc(moment(data.timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')).tz('Europe/Rome').format('HH:mm:ss.SSS') : data.time}</span>
                      </div>
                    )
                  })
                }
            </Scrollbars> 
              )
            }
            
            
                <div className={`video-content`} id="videoContentId" >
                  <img className={`${displayThumnailFullScreen?'':'hidden'}`} style={{width:'100%', height:'100%'}} src={displayThumnailFullScreen} />
                  <video loop={true} controls id="video-id_" preload="auto" className={` w-full h-full video-js vjs-default-skin ${displayThumnailFullScreen?'hidden':''}`} width="100%" height="100%"> 
  
                    <source src="https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
                            type="application/x-mpegURL"/>
                  </video>
                  {/* <div className={`${isControlsVisible?'':'hidden'} ${isFullScreen?'absolute bg-black bg-opacity-70 w-screen h-16 -ml-0 mr-0 bottom-0 m-0 left-0 pl-6':'relative w-full h-max bg-opacity-100 mr-6 ml-2 bottom-12'}  video-controls grid grid-flow-col grid-cols-video-controls`}>
                    <div className="inline__ w-8 cursor-pointer self-center">
                      {videoPlayStatus==='playing'?<span onClick={pauseVideo}><BiPause  size="30px" /></span>: <span onClick={playVideo}><BiPlay size="30"/></span>}
                    </div>
                    <div className={`slidecontainer w-20 inline__ mb-2 self-center ${isFullScreen?'ml-3':''}`}>
                      <input type="range" min={0} max={1} value={volume} step={0.01} onChange={onVolumeChange} id="volumeId" className="slider w-24 cursor-pointer"/>
                    </div>
                    <div onClick={toggleMute} className={`inline__ w-8  cursor-pointer self-center ${isFullScreen?'ml-4':''}`}>
                      {
                        volumeSizes[Object.keys(volumeSizes).sort(function(a,b) { return parseFloat(a) - parseFloat(b);}).find((val, key)=>(volume<=parseFloat(val)))]
                      }
                    </div>
                    <div className={`inline__ video-screen-toggler self-center ${isFullScreen?'pr-10':'pr-6'}`}>
                      <button onClick={FullScreenVideoSize}>
                        {isFullScreen?<BiExitFullscreen size={30}/>: <BiFullscreen />}
                      </button>
                    </div>
                  </div> */}
                </div>
              
            
  
          </div>
          )
        }

        <div className=" text-left mt-2">
          {
            (selectedType==='Radio')?(
              <div className='inline-block'>
                {/* <div className="grid grid-flow-col justify-start self-center"> */}
                  <div className="inline-block play-stop border-2 mr-1 pl-5 pr-5 cursor-pointer" onClick={()=>{ waveform.current.play()}}>
                      <BiPlay size="30"/>
                  </div>
                  <div className="inline-block play-stop border-2 text-white cursor-pointer" onClick={()=>{ waveform.current.pause()}}>
                      <BiStop size="30" />
                  </div>
                {/* </div> */}
              </div>
            ):(
              <>
              <div className={`inline-block slidecontainer w-20 inline__ mb-2 self-center ${isFullScreen?'ml-3':''}`}>
                    <input type="range" min={0} max={100} value={frameZoom} step={10} onChange={onFramesZoomChange} id="framesZoomInOutId" className="slider__generic w-24 cursor-pointer"/>
              </div>
              <div className="relative inline-block ml-6 align-middle frame-drop-width bg-black" onClick={()=>setDropdownOpen(!isDropdownOpen)}>
                  <div className="grid grid-flow-col  cursor-pointer border-2 border-gray-300 rounded-md pl-3 pr-3" >
                      <button className="inline-block bg-black text-gray-300 pl-1 pr-1 pt-0 text-lg">{selectedFrameOption.label}</button>
                      <span className=" pt-1 text-gray-300">{isDropdownOpen?<MdOutlineKeyboardArrowUp size={'1.7rem'}/>:<MdOutlineKeyboardArrowDown size={'1.7rem'}/>}</span>
                  </div>
                  <div id={`inner-sub-menu`} className={`${isDropdownOpen?'':'hidden'} absolute top-10  bg-black z-1100 rounded-lg w-full pb-2 border-2 border-gray-300`}>
                    <div className="grid grid-flow-row">

                      {
                        frameDropOptions.map((option, key)=>{
                          return (
                            <div key={key} onClick={()=>onFrameDropdownSelect(option)} className={`bg-black p-2 cursor-pointer hover:bg-gray-800 border-t-2 border-gray-800    ${selectedFrameOption.value===option.value?'bg-gray-800':''}`} >{option.label}</div>
                          )
                        })
                      }
                    
      
                    </div>
                  </div>
              </div>
              </>
            )
          }

              <div className={`relative inline-block ml-6 align-middle frame-drop-width bg-black ${selectedType==='Radio'?'mb-4':''}`} onClick={()=>setBeforeAfterSecondsFrameDropdownOpen(!isBeforeAfterSecondsFrameDropdownOpen)}>
                  <div className="grid grid-flow-col  cursor-pointer border-2 border-gray-300 rounded-md pl-3 pr-3" >
                      <button className="inline-block bg-black text-gray-300 pl-1 pr-1 pt-0 text-lg">{selectedBeforeAfterSecondsFrameOption.current.label}</button>
                      <span className=" pt-1 text-gray-300">{isBeforeAfterSecondsFrameDropdownOpen?<MdOutlineKeyboardArrowUp size={'1.7rem'}/>:<MdOutlineKeyboardArrowDown size={'1.7rem'}/>}</span>
                  </div>
                  <div id={`inner-sub-menu`} className={`${isBeforeAfterSecondsFrameDropdownOpen?'':'hidden'} absolute top-10  bg-black z-1100 rounded-lg w-full pb-2 border-2 border-gray-300`}>
                    <div className="grid grid-flow-row">

                      {
                        beforeAfterNumberOfFramesDropOptions.map((option, key)=>{
                          return (
                            <div key={key} onClick={()=>onBeforeAfterSecondsFrameDropdownSelect(option)} className={`bg-black p-2 cursor-pointer hover:bg-gray-800 border-t-2 border-gray-800    ${selectedBeforeAfterSecondsFrameOption.current.value===option.value?'bg-gray-800':''}`} >{option.label}</div>
                          )
                        })
                      }
                    
      
                    </div>
                  </div>
              </div>
        </div>

        <div className="grid grid-flow-col mt-2">
              <input type="text" className="  p-4 max-w-xs search-contents-bgc outline-none" placeholder="Search..." value={tableSearchField} onChange={onSearch}/>
              <Select
                placeholder='Select Channels'
                className="basic-single text-black"
                classNamePrefix="select"
                isMulti={true}
                // defaultValue={[channelsDropdown[0]]}
                value={multiSelectedChannel}
                isDisabled={false}
                isLoading={false}
                isClearable={false}
                isRtl={false}
                isSearchable={true}
                name="color"
                options={channelsDropdown}
                onChange={(val)=>setMultiSelectedChannel(val)}
                // onSelectResetsInput = {false}
              />
              <button className="p-4 pb-1 pr-3 uppercase grid grid-flow-col bg-fingerprint h-10 rounded-md w-max pt-2" onClick={()=>handleFetchClick()}>
                {
                  isTabledataLoading?(<span ><BiLoaderAlt className='pt-1 rotating' size="30" /></span>):'Fetch'
                } 
              </button>
              <div className="grid-flow-col grid place-content-end self-center">
                  <div className="relative">
                    <button className="p-4 search-contents-bgc pt-1 pb-1 pr-3 uppercase grid grid-flow-col" onClick={()=>setContentsDropdownOpen(!isContentsDropdownOpen)}>
                      <span className="self-center">Contents</span>
                      <span className="self-center text-gray-300 pl-1">{isContentsDropdownOpen?<MdOutlineKeyboardArrowUp size={'1.7rem'}/>:<MdOutlineKeyboardArrowDown size={'1.7rem'}/>}</span> 
                    </button>
                    <div className={`${isContentsDropdownOpen?'':'hidden'} absolute top-10  bg-black z-1100 rounded-lg w-full border-2 border-gray-300`}>
                    {
                      Object.entries(currentContentsOptions).map(([key,val])=>{
                        if(key === 'UNKNOWN'){
                          return null;
                        }
                        return <div key={key} onClick={()=>onContentsDropSelect(key, val)} className="grid grid-flow-col cursor-pointer border-b-2 border-gray-300 pt-1 pb-1 hover:bg-gray-800"> 
                          <span className="self-center">{val.label}</span>
                          <span className="self-center text-gray-300 pl-1 place-self-end">{val.value?<BiCheckboxChecked size={'1.7rem'}/>:<BiCheckbox size={'1.7rem'}/>}</span>

                        </div>
                      })
                    }
                    </div>
                  </div>
                  
                  <button className="p-4 bg-fingerprint pt-1 pb-1 uppercase ml-3" onClick={handleFingerprint}>Fingerprint </button>
              </div>
        </div>
        <div className="mt-5 search-contents-bgc p-10 pl-3 pr-3 grid">

                    <div className="grid grid-flow-col h-12 grid-cols-tableItems">
                        <div></div>
                        <div className=" place-self-start">Date/Time</div>
                        <div className=" place-self-start">Channel</div>
                        <div className=" place-self-start">Type</div>
                        <div className=" place-self-start">Duration</div>
                        <div className=" place-self-start">Matching</div>
                        <div className=" place-self-start">Name</div>
                        <div className=" place-self-start">Program</div>
                        
                    </div>
                    {
                      currentTableItems.map((item, key)=>{
                        return (

                          <div className="grid grid-flow-col grid-cols-tableItems mt-4 gap-1">
                            <div className="grid grid-flow-col"> 
                              <span className="pt-1 cursor-pointer" onClick={(e)=>{e.preventDefault();selectUnselectTableItem(!item.isSelected, key)}}>{item.isSelected?<BiCheckboxChecked size={'2rem'}/>: <BiCheckbox size={'2rem'}/>}</span>
                              <span className="mt-2">{item.isVerified?<AiFillCheckCircle color="green" size='1.5rem' className="bg-white rounded-full border-none"/>:<AiFillWarning color="yellow" size='1.5rem'/>}</span>
                            </div>
                            <div className=" place-self-start text-left">{item.dateTimeToShow?item.dateTimeToShow.format('DD/MM/YYYY HH:mm:ss'):item.dateTime.format('DD/MM/YYYY HH:mm:ss')}</div>
                            <div className=" place-self-start text-left">{item.channel}</div>
                            <div className=" place-self-start">{item.type}</div>
                            <div className=" place-self-start">{item.duration}</div>
                            <div className=" place-self-start">{item.matching}</div>
                            <div className=" place-self-start text-left">{item.name}</div>
                            <div className=" place-self-start text-left">{item.program}</div>
                            
                          </div>
                        );
                      })
                    }
                    <br/>
                    <ReactPaginate
                      nextLabel="Next"
                      onPageChange={handlePageClick}
                      pageRangeDisplayed={3}
                      marginPagesDisplayed={2}
                      pageCount={pageCount}
                      previousLabel="Previous"
                      pageClassName="page-item"
                      pageLinkClassName="page-link"
                      previousClassName="page-item"
                      previousLinkClassName="page-link"
                      nextClassName="page-item"
                      nextLinkClassName="page-link"
                      breakLabel="..."
                      breakClassName="page-item"
                      breakLinkClassName="page-link"
                      containerClassName="pagination"
                      activeClassName="active"
                      renderOnZeroPageCount={null}
                    />

        </div>
      </main>
      <video id="frames-video" className='hidden'>

      </video>
      <Modal
        size="sm"
        className='mr-5 w-96 modal-top z-2000'
        show={addModalOpen}
        onClose={()=>console.log('test value')}
        onHide={() => { setAddModalOpen(false);console.log('dddddd');setFingerprintModalOpen(true);}}
        // aria-labelledby="modal-modal-title"
        // aria-describedby="modal-modal-description"
      >
        <Modal.Header closeButton >

          <Modal.Title>
            <span className=''>
              Add a new {addModalOpen}
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className=''>
          {/* add a new brand ---- brands space */}
        {
            addModalOpen==='brand' && (
              <div className='grid grid-flow-row text-black'>
                <p >
                  Select a company
                </p>
                <Select
                  className="basic-single w-52 text-black"
                  classNamePrefix="select"
                  // defaultValue={colourOptions[0]}
                  isDisabled={false}
                  isLoading={isCompanyLoading}
                  isClearable={false}
                  isRtl={false}
                  isSearchable={true}
                  name="color"
                  value={typeStates['brand']['company']}
                  options={companyOptions}
                  onChange={(val)=>handleAddModalTypeChange(val, 'brand', 'company')}
                  // onSelectResetsInput = {false}
                />
              </div>
            )
          }
          {/* add a new product ---- products space*/}
          {
            addModalOpen==='product' && (
              <div className='grid grid-flow-row text-black'>
                <p >
                  Select a brand
                </p>
                <Select
                  className="basic-single w-52 text-black"
                  classNamePrefix="select"
                  // defaultValue={colourOptions[0]}
                  isDisabled={false}
                  isLoading={isBrandLoading}
                  isClearable={false}
                  isRtl={false}
                  isSearchable={true}
                  name="color"
                  value={typeStates[addModalOpen]['brand']}
                  options={brandOptions}
                  onChange={(val)=>handleAddModalTypeChange(val, addModalOpen, 'brand')}
                  // onSelectResetsInput = {false}
                />
              </div>
            )
          }
          {/* add a new sub category ---- sub category space*/}
          {
            addModalOpen==='subcategory' && (
              <div className='grid grid-flow-row text-black'>
                <p >
                  Select a category
                </p>
                <Select
                  className="basic-single w-52 text-black"
                  classNamePrefix="select"
                  // defaultValue={colourOptions[0]}
                  isDisabled={false}
                  isLoading={isCategoryLoading}
                  isClearable={false}
                  isRtl={false}
                  isSearchable={true}
                  name="color"
                  value={typeStates[addModalOpen]['category']}
                  options={categoryOptions}
                  onChange={(val)=>handleAddModalTypeChange(val, addModalOpen, 'category')}
                  // onSelectResetsInput = {false}
                />
              </div>
            )
          }
          {/* add a new spot ---- spot space*/}
          {
            addModalOpen==='spot' && (
              <>

              <div className='grid grid-flow-row text-black'>
                <p className='text-black'>
                  Select a Company
                </p>
                <Select
                  className="basic-single w-52 text-black"
                  classNamePrefix="select"
                  // defaultValue={colourOptions[0]}
                  isDisabled={false}
                  isLoading={isCompanyLoading}
                  isClearable={false}
                  isRtl={false}
                  isSearchable={true}
                  name="color"
                  options={companyOptions}
                  onChange={(val)=>onCompanyChange(val)}
                  // onSelectResetsInput = {false}
                />
              </div>
              <div className='grid grid-flow-row text-black'>
                <p className='text-black'>
                  Select a Brand
                </p>
                <Select
                  className="basic-single w-52 text-black"
                  classNamePrefix="select"
                  // defaultValue={colourOptions[0]}
                  isDisabled={false}
                  isLoading={isBrandLoading}
                  isClearable={false}
                  isRtl={false}
                  isSearchable={true}
                  value={selectedBrand}
                  name="color"
                  options={spotBrandOptions}
                  onChange={(val)=>onBrandsChange(val)}
                  // onSelectResetsInput = {false}
                />
              </div>
              <div className='grid grid-flow-row text-black'>
                <p >
                  Select a product
                </p>
                <Select
                  className="basic-single w-52 text-black"
                  classNamePrefix="select"
                  // defaultValue={colourOptions[0]}
                  isDisabled={false}
                  isLoading={isProductLoading}
                  isClearable={false}
                  isRtl={false}
                  isSearchable={true}
                  name="color"
                  value={typeStates[addModalOpen]['product']}
                  options={productOptions}
                  onChange={(val)=>handleAddModalTypeChange(val, addModalOpen, 'product')}
                  // onSelectResetsInput = {false}
                />
              </div>
              <div className='grid grid-flow-row text-black'>
                <p >
                  Select a sub category
                </p>
                <Select
                  className="basic-single w-52 text-black"
                  classNamePrefix="select"
                  // defaultValue={colourOptions[0]}
                  isDisabled={false}
                  isLoading={isSubCategoryLoading}
                  isClearable={false}
                  isRtl={false}
                  isSearchable={true}
                  name="color"
                  value={typeStates[addModalOpen]['subcategory']}
                  options={subCategoryOptions}
                  onChange={(val)=>handleAddModalTypeChange(val, addModalOpen, 'subcategory')}
                  // onSelectResetsInput = {false}
                />
              </div>
              <div className='grid grid-flow-row text-black'>
                <p >
                  Select a tag
                </p>
                <Select
                  className="basic-single w-52 text-black"
                  classNamePrefix="select"
                  // defaultValue={colourOptions[0]}
                  isDisabled={false}
                  isLoading={isTagLoading}
                  isClearable={false}
                  isRtl={false}
                  isSearchable={true}
                  name="color"
                  value={typeStates[addModalOpen]['tag']}
                  options={tagOptions}
                  onChange={(val)=>handleAddModalTypeChange(val, addModalOpen, 'tag')}
                  // onSelectResetsInput = {false}
                />
              </div>
              </>
            )
          }
          <div className='bg-white text-black'>
            <p>{addModalOpen} name: </p>
            <input className='text-black border-gray-300 rounded-md border-2 p-2 mt-2' value={typeStates?.[addModalOpen]?.['name']} onChange={(e)=>handleAddModalTypeChange(e.target.value, addModalOpen, 'name')} placeholder={`${addModalOpen} name`}/>
            <br/>
            <button className="p-4 bg-fingerprint pt-1 pb-1 uppercase ml-3 text-white rounded-md mt-4" onClick={handleCustomFingerprintSave}>SAVE </button>
          </div>
        </Modal.Body>
      </Modal>
      <Modal
        size="sm"
        className='mr-5 w-96'
        show={fingerprintModalOpen}
        // onClose={()=>setFingerprintModalOpen(false)}
        onHide={() => setFingerprintModalOpen(false)}
        // aria-labelledby="modal-modal-title"
        // aria-describedby="modal-modal-description"
      >
        <Modal.Header closeButton >
          
          <Modal.Title><span >
            Fingerprint
          </span></Modal.Title>
            
        </Modal.Header>
        <Modal.Body className='mr-5'>
          {
            lastRequestDetails?.selectedSource?.isRecognition  ?(
              <div className='bg-white text-black'>
                <p>Spotversion name: </p>
                <input className='text-black border-black rounded-md border-2 p-2 mt-2' value={spotVersionName} onChange={(e)=>setSpotVersionName(e.target.value)} placeholder='Name'/>
                <br/>
                <button className="p-4 bg-fingerprint pt-1 pb-1 uppercase ml-3 text-white rounded-md mt-4" onClick={handleFingerprintSave}>SAVE & UPDATE </button>
              </div>
            ):(
              <>
          <p className='text-black'>
            Add Company
          </p>
          <div className='grid grid-flow-col'>
            {/* <Select
                className="basic-single w-96 text-black"
                classNamePrefix="select"
                // defaultValue={colourOptions[0]}
                isDisabled={false}
                isLoading={isCompanyLoading}
                isClearable={false}
                isRtl={false}
                isSearchable={true}
                name="color"
                options={companyOptions}
                onChange={(val)=>onCompanyChange(val)}
                // onSelectResetsInput = {false}
              /> */}
              <button className="bg-blue-600 h-9 text-red-50 justify-self-center pl-4 pr-4 rounded-lg font-bold text-lg w-full" onClick={()=>handleAddModal('company')}>Add a new Company +</button>
            </div>
              <p className='mt-2 text-black'>Add a Brand</p>
            <div className='grid grid-flow-col'>
              {/* <Select
                className="basic-single w-96 text-black"
                classNamePrefix="select"
                // defaultValue={colourOptions[0]}
                isDisabled={false}
                isLoading={isBrandLoading}
                isClearable={true}
                isRtl={false}
                isSearchable={true}
                name="color"
                options={brandOptions}
                onChange={(val)=>onBrandsChange(val)}
                // onSelectResetsInput = {false}
              /> */}
              <button className="bg-blue-600 h-9 text-red-50 justify-self-center pl-4 pr-4 rounded-lg font-bold text-lg w-full" onClick={()=>handleAddModal('brand')}>Add a new brand +</button>
            </div>
            <p className='mt-2 text-black'>Add a Product</p>
            <div className='grid grid-flow-col'>
              {/* <Select
                className="basic-single w-96 text-black"
                classNamePrefix="select"
                // defaultValue={colourOptions[0]}
                isDisabled={false}
                isLoading={isProductLoading}
                isClearable={true}
                isRtl={false}
                isSearchable={true}
                name="color"
                options={productOptions}
                onChange={(val)=>onProductsChange(val)}
                // onSelectResetsInput = {false}
              /> */}
              <button className="bg-blue-600 h-9 text-red-50 justify-self-center pl-4 pr-4 rounded-lg font-bold text-lg w-full" onClick={()=>handleAddModal('product')}>Add a new product +</button>
            </div>
            <p className='mt-2 text-black'>Add a Category</p>
            <div className='grid grid-flow-col'>
              {/* <Select
                className="basic-single w-96 text-black"
                classNamePrefix="select"
                // defaultValue={colourOptions[0]}
                isDisabled={false}
                isLoading={isCategoryLoading}
                isClearable={true}
                isRtl={false}
                isSearchable={true}
                name="color"
                options={categoryOptions}
                onChange={(val)=>onCategoriesChange(val)}
                // onSelectResetsInput = {false}
              /> */}
               <button className="bg-blue-600 h-9 text-red-50 justify-self-center pl-4 pr-4 rounded-lg font-bold text-lg w-full" onClick={()=>handleAddModal('category')}>Add a new category +</button>
             </div>
             <p className='mt-2 text-black'>Add a Sub Category</p>
             <div className='grid grid-flow-col'>
                {/* <Select
                  className="basic-single w-96 text-black"
                  classNamePrefix="select"
                  // defaultValue={colourOptions[0]}
                  isDisabled={false}
                  isLoading={isSubCategoryLoading}
                  isClearable={true}
                  isRtl={false}
                  isSearchable={true}
                  name="color"
                  options={subCategoryOptions}
                  onChange={(val)=>onSubCategoriesChange(val)}
                  // onSelectResetsInput = {false}
                /> */}
                <button className="bg-blue-600 h-9 text-red-50 justify-self-center pl-4 pr-4 rounded-lg font-bold text-lg w-full" onClick={()=>handleAddModal('subcategory')}>Add a new sub category +</button>
              </div>
              <p className='mt-2 text-black'>Add a Tag</p>
             <div className='grid grid-flow-col'>
                {/* <Select
                  className="basic-single w-96 text-black"
                  classNamePrefix="select"
                  // defaultValue={colourOptions[0]}
                  isDisabled={false}
                  isLoading={isSubCategoryLoading}
                  isClearable={true}
                  isRtl={false}
                  isSearchable={true}
                  name="color"
                  options={subCategoryOptions}
                  onChange={(val)=>onSubCategoriesChange(val)}
                  // onSelectResetsInput = {false}
                /> */}
                <button className="bg-blue-600 h-9 text-red-50 justify-self-center pl-4 pr-4 rounded-lg font-bold text-lg w-full" onClick={()=>handleAddModal('tag')}>Add a new tag +</button>
              </div>
              <br/>
              <hr/>
              <p className='mt-2 text-black'>Select or add a new spot</p>
             <div className='grid grid-flow-col'>
                <Select
                  className="basic-single w-52 text-black"
                  classNamePrefix="select"
                  // defaultValue={colourOptions[0]}
                  isDisabled={false}
                  isLoading={isSpotLoading}
                  isClearable={true}
                  isRtl={false}
                  isSearchable={true}
                  value={selectedSpot}
                  name="color"
                  options={spotOptions}
                  onChange={(val)=>setSelectedSpot(val)}
                  // onSelectResetsInput = {false}
                />
                <button className="bg-blue-600  w-9 h-9 text-red-50 justify-self-end rounded-br-lg rounded-tr-lg font-bold text-2xl pb-4" onClick={()=>handleAddModal('spot')}>+</button>
              </div>
              <div className='bg-white text-black'>
                <p>Spotversion name: </p>
                <input className='text-black border-black rounded-md border-2 p-2 mt-2' value={typeName} onChange={(e)=>setTypeName(e.target.value)} placeholder='Name'/>
                <br/>
                <button className="p-4 bg-fingerprint pt-1 pb-1 uppercase ml-3 text-white rounded-md mt-4" onClick={handleNotRecognitionFingerprintSave}>SAVE </button>
              </div>
              </>
            )
          }

        </Modal.Body>
          
      </Modal>
    </div>
  );
}

export default Player;
