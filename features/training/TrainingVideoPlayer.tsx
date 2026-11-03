import { useMemo, useRef } from 'react';
import { WebView } from 'react-native-webview';

import type { TrainingVideoPlayerProps } from './video';

const literal = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c');
/** HTML is generated here; no administrator-supplied HTML or script is executed. */
export function TrainingVideoPlayer({
  src,
  title,
  position,
  captionsUrl,
  onProgress,
  onError,
}: TrainingVideoPlayerProps) {
  const resume = useRef(position);
  const html = useMemo(
    () => `<!doctype html><html lang="fr"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#0B1220}video{width:100%;height:100vh}</style><video id="v" controls playsinline preload="metadata"></video><script>
const v=document.getElementById('v');v.src=${literal(src)};v.setAttribute('aria-label',${literal(title)});
if(${literal(captionsUrl ?? '')}){const t=document.createElement('track');t.kind='captions';t.srclang='fr';t.label='Français';t.src=${literal(captionsUrl ?? '')};v.append(t);}
let last=0;function send(){window.ReactNativeWebView.postMessage(JSON.stringify({position:v.currentTime}));}
v.onloadedmetadata=()=>{v.currentTime=Math.min(${Number.isFinite(resume.current) ? Math.max(0, resume.current) : 0},v.duration);send();};
v.ontimeupdate=()=>{if(!v.paused&&Date.now()-last>=5000){last=Date.now();send();}};v.onpause=send;v.onended=send;
v.onerror=()=>window.ReactNativeWebView.postMessage(JSON.stringify({error:true}));</script></html>`,
    [src, title, captionsUrl],
  );
  return (
    <WebView
      source={{ html }}
      style={{ height: 230, borderRadius: 12 }}
      allowsFullscreenVideo
      allowsInlineMediaPlayback
      originWhitelist={['about:blank']}
      onShouldStartLoadWithRequest={({ url }) => url === 'about:blank'}
      onMessage={({ nativeEvent }) => {
        try {
          const data = JSON.parse(nativeEvent.data);
          if (data.error) onError();
          else if (Number.isFinite(data.position)) onProgress(data.position);
        } catch {
          onError();
        }
      }}
    />
  );
}
