"use client";

import React, { use, useEffect, useMemo, useRef, useState } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import { genHeaders } from "@/shared/api/common";
import axios from "axios";
import { HEADER_API_URL } from "@/app/Constant";
import { error, log } from "console";
import { formatTime } from "@/shared/util/formatTime";
import { encodeWAV } from "@/shared/util/fileUtil";
import useMeStore from "@/app/stores/me-store/useMeStore";
import Markdown from "react-markdown";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";

const TRANSACTION_COUNT = 10;

export default function TranscribePage() {
  // 회의 정보
  const [meetingTitle, setMeetingTitle] = useState<string>("");
  const [meetingDescription, setMeetingDescription] = useState<string>("");
  const [participants, setParticipants] = useState<string>("");

  // 녹취 상태
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [confluenceUrl, setConfluenceUrl] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [modifyIsPrivate, setModifyIsPrivate] = useState(false);

  // 내부 참조
  const logsRef = useRef<string[]>([]);
  const participantsRef = useRef<string>("");
  const recognizedCountRef = useRef<number>(0);
  const speakers = useRef<Record<string, string>>({});
  const transcriberRef = useRef<SpeechSDK.ConversationTranscriber | null>(null);
  const recorderRef = useRef<MediaRecorder>();
  const speechConfigRef = useRef<SpeechSDK.SpeechConfig>();
  const chunksRef = useRef<Blob[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // API 토큰 가져오기
  useEffect(() => {
    const fetchToken = async () => {
      const res = await fetch("/api/agents/noteai");
      if (!res.ok) {
        console.error("토큰 요청 실패");
        return;
      }
      const { token, region } = await res.json();
      const config = SpeechSDK.SpeechConfig.fromAuthorizationToken(
        token,
        region
      );
      config.speechRecognitionLanguage = "ko-KR";
      speechConfigRef.current = config;
    };
    fetchToken();

    const meetingTitle = localStorage.getItem("meetingTitle");
    const meetingDescription = localStorage.getItem("meetingDescription");
    const participants = localStorage.getItem("participants");
    const summary = localStorage.getItem("summary");
    const logs = localStorage.getItem("logs");
    const confluenceUrl = localStorage.getItem("confluenceUrl");

    if (meetingTitle && meetingTitle != "") setMeetingTitle(meetingTitle);
    if (meetingDescription && meetingDescription != "")
      setMeetingDescription(meetingDescription);
    if (participants && participants != "") {
      setParticipants(participants);
      participantsRef.current = participants;
    }
    if (logs && logs != "") {
      setLogs(JSON.parse(logs));
      logsRef.current = JSON.parse(logs);
    }
    if (confluenceUrl && confluenceUrl != "") setConfluenceUrl(confluenceUrl);
    if (summary && summary != "") setSummary(summary);
  }, []);

  // 참가자 라벨 매핑
  const { participantsList, labelMap } = useMemo(() => {
    const list = participants
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n);
    const map: Record<string, string> = {};
    list.forEach((name, idx) => {
      map[String.fromCharCode(65 + idx)] = name;
    });
    return { participantsList: list, labelMap: map };
  }, [participants]);

  // 로그 추가 함수
  const appendLog = (line: string) => {
    const next = [...logsRef.current, line];
    logsRef.current = next;
    setLogs(next);
    localStorage.setItem("logs", JSON.stringify(next));

    // 음성 인식된 문장 카운트
  };

  // 맞춤법 교정 API 호출
  const grammarCheck = async (last10: string[], last20: string[]) => {
    try {
      // "[HH:mm:ss][화자] 텍스트" → 순수 텍스트만 추출
      const prev: string = last20.join("\n");
      const question: string = last10.join("\n");
      //console.log(question);

      const SYSTEM = `너는 회의록을 작성하는 지혜AI야. 주어진 회의정보 를 바탕으로 사용자들의 녹음 내용의 오타를 자연스럽게 교정해줘. 불필요한 설명 제외하고, Example 형식대로만 답변해줘.
# 회의정보            
- 제목: ${meetingTitle}
- 참석자: ${participantsList}
- 내용: ${meetingDescription}
- 이전 대화 내용
"
${prev}
"    

# Example
## User:
[20:27:13][화자 B] 그래서 낙하를 해도 데미지는 별로 없는 거죠. 부피가 작으니까 재밋지 못한 적도 살잖아요. 살죠. 집을 던지지 이런 말씀.
[20:27:42][화자 B] 동물을 사랑하시는 분이여 가지고?
[20:27:42][화자 B] 근데 너무 작으면은 사실 좀 천적들한테 공격을 쉽게 당할 수도, 약간 예를 들어서 개미핥기 있잖아. 개미핥기가 코 한번 딱 대고 청소기 마냥 돌려버리면은 순식간에 빨아들이는데.
[20:27:42][화자 A] 그거는 근데 제가 보기에는 개미할 게 특정화돼있는 거고 정말 작은 틈새에 숨어면은 천적들은 더 크잖아요. 그러니까 오히려 보호하기가 더 좋은 거 아닌가?
[20:27:43][화자 C] 얘기할 게 붙어있는 지적이에요. 일단 개미는 개미같이 그렇게 자연에 모여있는 게 너무 좋은.
[20:28:04][화자 C] 먹이 원이에요. 그리고 포유류를 보면은 개미를 사냥하는 게 굉장히 많아요. 개미핥기도 있긴 하지만은 침팬지 코일라 기멍 바짝 이렇게 이렇게 두부족에서 게임 파워 이렇게 해가지고 이렇게 먹잖아요. 굉장히 잘 먹어요. 그래서 개미를 많이 먹는 포식자가 있는 개미들은 그거에 대응해서 딱 다 전략들이 있어요. 특히 독이세요.
[20:28:25][화자 C] 개미들이 개미들이 그래서 개미롭게 먹다가 아 먹고 나갔구나 울 정도로 굉장히 또 있습니다. 그리고 그.
[20:28:25][화자 D] 개미핥기에도 말씀하셨지만 개미핥기가 허록하지만 예를 들어서 개미가 만 마리가 있어요. 만 마리 다 호로록 하기 쉽지가 않잖아요. 그러니까 항상 살아남는 애들이 있을 거 아니에요.
[20:28:25][화자 B] 미팅이죠? 그건 네, 그렇죠.
[20:28:32][화자 B] 사무차팅도.
[20:28:32][화자 D] 기러기 키핑, 그러니까 훨씬 어떻게 보면 대멸동 상황 같은 데서 운 좋게 살아남을 수 있을 확률이.

## Answer:
[20:27:13][화자 B] 그래서 낙하를 해도 데미지가 별로 없잖아요. 부피가 작으니까요. 재미없는 적도 살 수 있죠. 살죠. 집어던져도 그렇고요.
[20:27:42][화자 B] 동물을 사랑하시는 분이셔서 그런가요?
[20:27:42][화자 B] 근데 너무 작으면 사실 천적들한테 쉽게 공격당할 수도 있어요. 예를 들어서 개미핥기 아시죠? 개미핥기가 코를 한 번 딱 대고, 진공청기처럼 쭉 빨아들이면 순식간이에요.
[20:27:42][화자 A] 그건 근데 개미핥기한테 특화된 경우고, 정말 작은 틈새에 숨어 있으면 천적들이 더 크니까 오히려 보호되기 쉬운 거 아닌가요?
[20:27:43][화자 C] 좋은 지적이에요. 일단 개미는 개미끼리 자연스럽게 군집을 이루고 있다는 점도 참 좋아요.
[20:28:04][화자 C] 개미는 먹이원이에요. 그리고 포유류 중에 개미를 사냥하는 동물도 많아요. 개미핥기뿐만 아니라 침팬지, 고릴라도 개미집 근처에서 나뭇가지 같은 걸로 휘저어서 개미를 꺼내 먹잖아요. 굉장히 잘 먹죠. 그래서 개미를 주로 먹는 포식자들이 많은데, 그런 개미들은 거기에 대응하는 전략들을 갖고 있어요. 특히 독을 가진 경우도 있고요.
[20:28:25][화자 C] 그래서 개미들이 개미답게 뭔가 대응을 하다가, 포식자가 “어, 먹고 나갔네?” 싶을 정도로 다양한 전략이 있죠.
[20:28:25][화자 D] 말씀하신 개미핥기도 그렇지만, 예를 들어 개미가 만 마리 있다면 그걸 전부 한 번에 다 빨아들이긴 어렵잖아요. 그러니까 항상 살아남는 개체는 남게 되는 거죠.
[20:28:25][화자 B] 그렇죠, 맞아요.
[20:28:32][화자 B] 그런 점이 생존 전략이 되는 거죠.
[20:28:32][화자 D] 결국 그런 식으로, 대규모 포식 상황에서도 운 좋게 살아남을 가능성이 생기는 거예요.
          
            `;
      // console.log(SYSTEM);

      // API
      const headers = await genHeaders([], "ixinote");
      const instance = axios.create({
        baseURL: headers[HEADER_API_URL],
      });
      const body = {
        model: "gpt-4o-mini",
        // bundle: 'new',
        stream: false,
        messages: [] as { role: string; content: string }[],
      };
      body.messages.push({
        role: "system",
        content: SYSTEM,
      });
      body.messages.push({
        role: "user",
        content: question,
      });
      const res = await instance.post("/web/chat/completions", body, {
        headers: headers,
      });
      //console.log("--------")
      const answer = await res.data.choices[0].message.content;
      //console.log("answer: ", answer);

      // 마지막 10개 로그를 교정된 문장으로 교체
      const corrected = answer.split("\n");
      const updated = logsRef.current.map((line, idx) => {
        const base = logsRef.current.length - corrected.length;
        if (idx >= base) {
          //const prefix = (line.match(/^(\[.*?\]\[.*?\]\s)/) || ['',''])[1]
          //return `${prefix}${corrected[idx - base]}`
          return corrected[idx - base];
        }
        return line;
      });

      setLogs([...updated]);
      // localStorage.setItem('logs', JSON.stringify([...updated]));
      // appendLog('📝 10개 문장 교정 완료')
    } catch (err) {
      console.error(err);
      // appendLog('⚠️ 교정 중 오류 발생')
    }
  };

  const summarizeNote = async () => {
    const meetingLog: string = logs.join("\n");
    const SYSTEM = `다음은 회의 녹음 내용을 바탕으로 작성된 속기본입니다. 이 내용을 바탕으로 회의 요약 보고서를 작성해주세요.

📌 **작성 지침**
- 문장 중심의 보고서 스타일로 작성해주세요.
- 전체 구조는 다음 항목을 반드시 포함해야 합니다:
  1. 📄 **회의 개요**: 회의 목적, 일시, 참석자
  2. 🧩 **주요 논의 내용**: 주제별 문단 구분, 발언 요지를 간결하게 정리
  3. ✅ **주요 결정 사항**: 결정된 사항을 명확히 명시
  4. 🔧 **후속 조치 및 요청사항**: 실행 책임자 및 일정 등 구체적으로 기술

📌 **형식 및 표현 주의사항**
- 결과물은 기본적으로 **한국어로 작성**하되, 회의에서 언급된 고유명사(예: 브랜드명, 시스템명, 기능명)나 필수적인 영어 단어는 그대로 사용해도 됩니다.
- 단, 맥락 없이 등장하는 외국어(예: 히브리어, 아랍어, 러시아어 등)는 절대 포함하지 마세요.
- 불필요한 잡담, 중복 내용은 생략하고, 중요한 논의와 결정사항을 중심으로 요약해주세요.
- 문장은 간결하고 명확하게, 문어체 보고서 형식으로 작성해주세요.
`;

    // API
    const headers = await genHeaders([], "ixinote");
    const instance = axios.create({
      baseURL: headers[HEADER_API_URL],
    });
    const body = {
      model: "gpt-4o-mini",
      // bundle: 'new',
      stream: false,
      messages: [] as { role: string; content: string }[],
    };
    body.messages.push({
      role: "system",
      content: SYSTEM,
    });
    body.messages.push({
      role: "user",
      content: meetingLog,
    });
    const res = await instance.post("/web/chat/completions", body, {
      headers: headers,
    });
    const meetingSummary = await res?.data?.choices?.[0]?.message?.content;
    setSummary(meetingSummary);
    localStorage.setItem("summary", meetingSummary);
    return meetingSummary;
  };

  const postConfluence = async (
    content: string,
    ancestorId: string,
    title: string
  ) => {
    if (!audioUrl || !logs) {
      return;
    }

    const response = await axios.get("/api/confluence", {
      params: { title: title, spaceKey: "MadangWorkAgent" },
    });
    console.info("response", response);

    const pageResult = response.data.results?.[0];
    console.info("pageResult", pageResult);

    let confluenceInfo = null;
    if (pageResult) {
      console.info(
        'pageResult["version"]["number"]',
        pageResult["version"]["number"]
      );
      confluenceInfo = await axios.put(`/api/confluence/${pageResult["id"]}`, {
        content: content,
        title: title,
        version: pageResult["version"]["number"] + 1,
      });
    } else {
      confluenceInfo = await axios.post("/api/confluence", {
        content: content,
        ancestorId: ancestorId,
        title: title,
        spaceKey: "MadangWorkAgent",
      });
    }

    console.info("confluenceInfo", confluenceInfo);

    if (confluenceInfo?.data?.title) {
      setConfluenceUrl(
        confluenceInfo.data._links.base + confluenceInfo.data._links.webui
      );
      localStorage.setItem(
        "confluenceUrl",
        confluenceInfo.data._links.base + confluenceInfo.data._links.webui
      );
    }

    const blob = await fetch(audioUrl).then((res) => res.blob());
    const file = new File([blob], "audio.webm", { type: "blob.type" });
    // 15분으로 wav 파일 분할
    const wavFile = await webmToWav(file, 900);
    let audioMacros = `<h2>
      <ac:emoticon ac:name="blue-star" ac:emoji-shortname=":cd:" ac:emoji-id="1f4bf" ac:emoji-fallback="💿" /> 회의 녹음</h2>`;
    let fileUploadSuccess = 0;
    for (let index = 0; index < wavFile.length; index++) {
      const element = wavFile[index];
      const formData = new FormData();
      formData.append("file", element, "audio_" + index + ".wav");

      const fileResponse = await axios.put(
        `/api/confluence/${confluenceInfo.data.id}/child/attachment`,
        formData
      );
      console.info("fileResponse", fileResponse);

      if (fileResponse?.data?.results?.[0]) {
        fileUploadSuccess += 1;

        const audioMacro = `<p><ac:structured-macro ac:name="view-file" ac:schema-version="1"><ac:parameter ac:name="name"><ri:attachment ri:filename="${fileResponse.data.results[0].title}" ri:version-at-save=${fileResponse.data.results[0].version.number} /></ac:parameter></ac:structured-macro> </p>`;
        audioMacros += audioMacro;

        console.info(
          "confluenceInfo.data.version.number",
          confluenceInfo.data.version.number
        );
        const confluenceInfo2 = await axios.put(
          `/api/confluence/${confluenceInfo.data.id}`,
          {
            content:
              confluenceInfo.data.body.storage.value + "\n\n" + audioMacros,
            title: title,
            version: confluenceInfo.data.version.number + fileUploadSuccess,
          }
        );
        if (confluenceInfo2?.data?.title) {
          console.info(
            "confluenceInfo2.data.version.number",
            confluenceInfo2.data.version.number
          );
          setConfluenceUrl(
            confluenceInfo2.data._links.base + confluenceInfo2.data._links.webui
          );
          localStorage.setItem(
            "confluenceUrl",
            confluenceInfo2.data._links.base + confluenceInfo2.data._links.webui
          );
        }
      }
    }

    if (isPrivate && confluenceInfo?.data?.title) {
      // 이메일로 User 정보 조회
      const { email, loginId } = useMeStore.getState().getMe();
      const userInfo = await axios.get(`/api/confluence/user`, {
        params: { email: email },
      });
      const jihyeInfo = await axios.get(`/api/confluence/user`, {
        params: { email: "jihyeai@lguplus.co.kr" },
      });
      if (userInfo?.data?.[0]?.accountId && jihyeInfo?.data?.[0]?.accountId) {
        const accountId = userInfo?.data?.[0]?.accountId;
        const jihyeAccountId = jihyeInfo?.data?.[0]?.accountId;
        const accountIds = [accountId, jihyeAccountId];
        const restrictionResult = await axios.put(
          `/api/confluence/${confluenceInfo.data.id}/restriction`,
          {
            accountIds: accountIds,
          }
        );
        console.info("restrictionResult", restrictionResult);
      }
    } else if (!isPrivate && confluenceInfo?.data?.title) {
      const restrictionResult = await axios.delete(
        `/api/confluence/${confluenceInfo.data.id}/restriction`
      );
      console.info("restrictionResult", restrictionResult);
    }
  };

  const webmToWav = async (file: File, segmentSec: number): Promise<Blob[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new AudioContext();
    const originalBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const sampleRate = originalBuffer.sampleRate;
    const frameCount = originalBuffer.length;
    const segmentFrameCount = segmentSec * sampleRate;
    const numSegments = Math.ceil(frameCount / segmentFrameCount);

    const wavBlobs: Blob[] = [];

    for (let i = 0; i < numSegments; i++) {
      const startFrame = i * segmentFrameCount;
      const endFrame = Math.min(startFrame + segmentFrameCount, frameCount);
      const length = endFrame - startFrame;

      // 2) 잘린 AudioBuffer 생성
      const segmentBuffer = audioContext.createBuffer(
        originalBuffer.numberOfChannels,
        length,
        sampleRate
      );
      for (let ch = 0; ch < originalBuffer.numberOfChannels; ch++) {
        const channelData = originalBuffer
          .getChannelData(ch)
          .subarray(startFrame, endFrame);
        segmentBuffer.copyToChannel(channelData, ch, 0);
      }

      // 3) WAV 포맷으로 인코딩 (encodeWAV은 기존 구현 사용)
      const wavBuffer = encodeWAV(segmentBuffer);
      wavBlobs.push(new Blob([wavBuffer], { type: "audio/wav" }));
    }

    return wavBlobs;
  };

  // 녹취 시작
  const startTranscribing = async () => {
    const speechConfig = speechConfigRef.current;
    if (!speechConfig || isTranscribing) return;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      chunksRef.current = [];
      setAudioUrl(URL.createObjectURL(blob));
    };
    recorder.start();
    recorderRef.current = recorder;

    const transcriber = createTranscriber();
    transcriberRef.current = transcriber;

    try {
      await transcriber.startTranscribingAsync();
      appendLog("🎤 회의 시작");
      setIsTranscribing(true);
    } catch (err) {
      console.error("녹취 시작 실패:", err);
      appendLog("❌ 녹취 시작 중 오류 발생");
      setIsTranscribing(false);
    }
  };

  function createTranscriber(): SpeechSDK.ConversationTranscriber {
    const speechConfig = speechConfigRef.current!;
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const transcriber = new SpeechSDK.ConversationTranscriber(
      speechConfig,
      audioConfig
    );
    transcriberRef.current = transcriber;

    transcriber.transcribed = (_s, evt) => {
      const result = evt.result;
      const time = formatTime(new Date());
      if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        const id = result.speakerId!;
        if (!speakers.current[id]) {
          speakers.current[id] = String.fromCharCode(
            65 + Object.keys(speakers.current).length
          );
        }
        const label = speakers.current[id];
        const name = labelMap[label] || `화자 ${label}`;
        appendLog(`[${time}][${name}] ${result.text}`);
      }
    };

    // canceled나 sessionStopped 이벤트에서 '새로운 transcriber 생성 후 재시작' 로직만 수행
    const restartHandler = async (_s: any, evt: any) => {
      console.warn("🚨 이벤트 발생:", evt);
      appendLog("⏸️ 회의 녹음이 중단되었습니다. 자동 재시작 준비 중...");
      try {
        // 1) 기존 transcriber가 있으면 멈추고 참조 해제
        if (transcriberRef.current) {
          await transcriberRef.current.stopTranscribingAsync();
          transcriberRef.current = null;
        }

        const fetchToken = async () => {
          const res = await fetch("/api/agents/noteai");
          if (!res.ok) {
            console.error("토큰 요청 실패");
            return;
          }
          const { token, region } = await res.json();
          const config = SpeechSDK.SpeechConfig.fromAuthorizationToken(
            token,
            region
          );
          config.speechRecognitionLanguage = "ko-KR";
          speechConfigRef.current = config;
        };
        await fetchToken();

        // 2) 새로운 transcriber 생성
        const newTranscriber = createTranscriber();
        transcriberRef.current = newTranscriber;

        // 3) 녹취 재시작
        await newTranscriber.startTranscribingAsync();
        appendLog("▶️ 자동 재시작 완료");
      } catch (e) {
        console.error("자동 재시작 실패:", e);
        appendLog("❌ 자동 재시작 중 오류 발생");
      }
    };

    transcriber.canceled = restartHandler;
    // transcriber.sessionStopped = restartHandler;

    return transcriber;
  }

  // 녹취 종료
  const stopTranscribing = async () => {
    if (transcriberRef.current && recorderRef.current && isTranscribing) {
      recorderRef.current.stop();
      await new Promise<void>((resolve) => {
        transcriberRef.current.stopTranscribingAsync(
          () => {
            appendLog("🛑 회의 종료");
            resolve();
          },
          (error) => {
            console.log(error);
            resolve();
          }
        );
      });

      setIsTranscribing(false);
      replaceSpeakers([...logsRef.current], participantsRef.current);
      // await summarizeNote(logs);
    }
  };

  const modifyTranscribing = async () => {
    replaceSpeakers([...logsRef.current], participantsRef.current);
    setModifyIsPrivate(true);
    // await summarizeNote(logs);
  };

  const replaceSpeakers = (logs: string[], participants: string) => {
    if (participants.length == 0) {
      return;
    }
    // 1) "에이, 비, 씨, 디" → ['에이','비','씨','디']
    const names = participants.split(",").map((n) => n.trim());
    // 2) 실제 발화자(예: '이','김') → 대체할 이름('에이','비'…) 매핑 테이블
    const mapping: Record<string, string> = {};
    let idx = 0;

    // 3) [HH:MM:SS][발화자] 패턴 찾아 바꿔치기
    const pattern = /\[(\d{2}:\d{2}:\d{2})]\[([^\]]+)]/;
    const updatedLogs = logs.map((line) =>
      line.replace(pattern, (_match, time, speaker) => {
        // 아직 매핑 없고, 남은 participants 이름이 있으면 새로 할당
        if (!(speaker in mapping) && idx < names.length) {
          mapping[speaker] = names[idx++];
        }
        const newName = mapping[speaker] ?? speaker;
        return `[${time}][${newName}]`;
      })
    );
    setLogs(updatedLogs);
  };

  const handlePrivateCheckBox = (event) => {
    setIsPrivate(event.target.checked);
  };

  // const fixLogsContext = () => {
  //   recognizedCountRef.current += 1;
  //   if (recognizedCountRef.current % TRANSACTION_COUNT === 0) {
  //     const last10 = log.slice(-TRANSACTION_COUNT);

  //     let last20: string[] = [];
  //     if (logs.length >= TRANSACTION_COUNT * 2) {
  //       last20 = logs.slice(-TRANSACTION_COUNT * 2, -TRANSACTION_COUNT);
  //     }
  //     grammarCheck(last10, last20);
  //   }
  // };

  useEffect(() => {
    // fixLogsContext();
    (async () => {
      if (!isTranscribing && logs.length > 0 && audioUrl) {
        localStorage.setItem("logs", JSON.stringify(logs));
        const summary = await summarizeNote();

        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const d = String(today.getDate()).padStart(2, "0");
        const todayString = `${y}${m}${d}`;
        await postConfluence(
          generateMeetingHtml(logs, summary, participants, meetingDescription),
          "484935300",
          `${todayString} 회의록${
            meetingTitle != "" ? " : " + meetingTitle : ""
          }`
        );
      }
    })();
  }, [logs, isTranscribing, audioUrl]);

  useEffect(() => {
    if (modifyIsPrivate) {
      (async () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const d = String(today.getDate()).padStart(2, "0");
        const todayString = `${y}${m}${d}`;
        const title = `${todayString} 회의록${
          meetingTitle != "" ? " : " + meetingTitle : ""
        }`;
        const response = await axios.get("/api/confluence", {
          params: { title: title, spaceKey: "MadangWorkAgent" },
        });
        console.info("response", response);
        const confluenceInfo = response.data.results?.[0];
        console.info("confluenceInfo", confluenceInfo);
        if (isPrivate && confluenceInfo?.title) {
          // 이메일로 User 정보 조회
          const { email, loginId } = useMeStore.getState().getMe();
          const userInfo = await axios.get(`/api/confluence/user`, {
            params: { email: email },
          });
          const jihyeInfo = await axios.get(`/api/confluence/user`, {
            params: { email: "jihyeai@lguplus.co.kr" },
          });
          if (
            userInfo?.data?.[0]?.accountId &&
            jihyeInfo?.data?.[0]?.accountId
          ) {
            const accountId = userInfo?.data?.[0]?.accountId;
            const jihyeAccountId = jihyeInfo?.data?.[0]?.accountId;
            const accountIds = [accountId, jihyeAccountId];
            const restrictionResult = await axios.put(
              `/api/confluence/${confluenceInfo.id}/restriction`,
              {
                accountIds: accountIds,
              }
            );
            console.info("restrictionResult", restrictionResult);
          }
        } else if (!isPrivate && confluenceInfo?.title) {
          const restrictionResult = await axios.delete(
            `/api/confluence/${confluenceInfo.id}/restriction`
          );
          console.info("restrictionResult", restrictionResult);
        }

        setModifyIsPrivate(false);
      })();
    }
  }, [modifyIsPrivate]);

  const generateMeetingHtml = (
    logs: string[],
    summary: string,
    participants: string,
    meetingDescription: string
  ) => {
    // 1) 오늘 날짜를 "YYYY-MM-DD" 포맷으로
    const today = new Date().toISOString().split("T")[0];

    // 2) 참석자 ID 배열로 분리 → <li> 생성
    const ids = participants
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const participantsHtml = ids.length
      ? ids
          .map(
            (id) => `
      <li>
        <p>${id}</p>
      </li>`
          )
          .join("")
      : `<li><p /></li>`;

    // 3) 목표(목적) 리스트
    const goalsHtml = meetingDescription
      ? `<li><p>${meetingDescription}</p></li>`
      : `<li><p /></li>`;

    // 4) 회의록 리스트
    const logsHtml = logs.length
      ? logs
          .map(
            (item) => `
      <li>
        <p>${item}</p>
      </li>`
          )
          .join("")
      : `<li><p /></li>`;

    // 5) 회의 요약 본문
    console.log(summary);
    const summaryHtml = summary
      ? `<p>${summary
          .replace(/\n/g, "<br/>")
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/^([📄🧩✅🔧].+?)\n/gm, "<h2>$1</h2>")
          .replace(/^\d+\.\s(.+)/gm, "<li>$1</li>")
          .replace(/(<li>.*<\/li>)/gs, "<ol>$1</ol>")
          .replace(/^- (.+)/gm, "<li>$1</li>")
          .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
          .replace(/\n{2,}/g, "</p><p>")}</p>`
      : `<p />`;

    return `
<h2>
    <ac:emoticon ac:name="blue-star" ac:emoji-shortname=":calendar_spiral:" ac:emoji-id="1f5d3" ac:emoji-fallback="\\uD83D\\uDDD3" /> 날짜
</h2>
<p><time datetime="${today}"/></p>
<h2>
    <ac:emoticon ac:name="blue-star" ac:emoji-shortname=":busts_in_silhouette:" ac:emoji-id="1f465" ac:emoji-fallback="\\uD83D\\uDC65" /> 참석자
</h2>
<ul>
${participantsHtml}
</ul>

<h2>
    <ac:emoticon ac:name="blue-star" ac:emoji-shortname=":goal:" ac:emoji-id="1f945" ac:emoji-fallback="\\uD83E\\uDD45" /> 목표
</h2>
<ul>
${goalsHtml}
</ul>

<h2>
    <ac:emoticon ac:name="blue-star" ac:emoji-shortname=":white_check_mark:" ac:emoji-id="2705" ac:emoji-fallback="✅" /> 회의 요약
</h2>
${summaryHtml}

<h2>
    <ac:emoticon ac:name="blue-star" ac:emoji-shortname=":speaking_head:" ac:emoji-id="1f5e3" ac:emoji-fallback="\\uD83D\\uDDE3" /> 회의록
</h2>
<ul>
${logsHtml}
</ul>
`;
  };

  useEffect(() => {
    const el = logContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full h-screen">
      <h1 className="text-2xl font-semibold p-4">ixi-note (AI 회의록)</h1>
      <div className="flex">
        <div className="w-1/2 p-4">
          {/* 회의 정보 입력 */}
          <div className="mb-4 space-y-2">
            <input
              type="text"
              placeholder="회의 제목"
              value={meetingTitle}
              onChange={(e) => {
                setMeetingTitle(e.target.value);
                localStorage.setItem("meetingTitle", e.target.value);
              }}
              className="w-full border border-gray-300 rounded p-2"
            />
            <textarea
              placeholder="회의 설명"
              value={meetingDescription}
              onChange={(e) => {
                setMeetingDescription(e.target.value);
                localStorage.setItem("meetingDescription", e.target.value);
              }}
              className="w-full border border-gray-300 rounded p-2"
            />
            <input
              type="text"
              placeholder="참석자 (쉼표로 구분)"
              value={participants}
              onChange={(e) => {
                setParticipants(e.target.value);
                participantsRef.current = e.target.value;
                localStorage.setItem("participants", e.target.value);
              }}
              className="w-full border border-gray-300 rounded p-2"
            />
            {participantsList.length > 0 && (
              <div className="text-sm text-gray-600">
                {participantsList.map((name, idx) => (
                  <span key={idx} className="inline-block mr-4">
                    {String.fromCharCode(65 + idx)}: {name}
                  </span>
                ))}
              </div>
            )}
            <div>
              <label>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={handlePrivateCheckBox}
                />
                비공개 게시
              </label>
            </div>
          </div>
          <div className="mb-4">
            <button
              onClick={startTranscribing}
              disabled={isTranscribing}
              className="px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50"
            >
              시작
            </button>
            <button
              onClick={stopTranscribing}
              disabled={!isTranscribing}
              className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50 ml-2"
            >
              종료
            </button>
            <button
              onClick={modifyTranscribing}
              disabled={isTranscribing}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50 ml-2"
            >
              수정
            </button>
          </div>
          <div className="mb-4">
            {audioUrl && (
              <h2 className="text-lg font-medium mt-4 mb-2">회의 녹음</h2>
            )}
            {audioUrl && (
              <audio
                src={audioUrl}
                controls
                className="w-full rounded border"
              />
            )}
            {summary && (
              <h2 className="text-lg font-medium mt-4 mb-2">회의 요약</h2>
            )}
            {summary && (
              <div className="border border-gray-200 rounded p-2 overflow-y-auto bg-gray-50 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                <MarkdownRenderer content={summary}></MarkdownRenderer>
              </div>
            )}
            {confluenceUrl && (
              <h2 className="text-lg font-medium mt-4 mb-2">회의 링크</h2>
            )}
            {confluenceUrl && (
              <div className="border border-gray-200 rounded p-2 overflow-y-auto bg-gray-50 whitespace-pre-wrap break-words">
                {confluenceUrl}
              </div>
            )}
          </div>
        </div>
        <div className="w-1/2 p-4">
          <div
            ref={logContainerRef}
            className="border border-gray-200 rounded p-2 flex-1 overflow-y-auto bg-gray-50 whitespace-pre-wrap max-h-[700px] overflow-y-auto"
          >
            {logs.map((line, idx) => (
              <div key={idx} className="mb-1 text-sm">
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
