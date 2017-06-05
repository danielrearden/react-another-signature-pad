# Yet Another React Signature Pad
This is another signature capture component based on Szymon Nowak's fantastic 
[Signature Pad](https://github.com/szimek/signature_pad/) library.

While there's already a lot of great options out there, none of them met my 
exact needs so I put this together. Here are the main highlights:
- Utilizes ES6 class instead of React.createClass
- A simple wrapper around canvas -- no extra buttons or other elements
- Easy styling by passing either a style object or a class name as props
- Ability to get blob instead of data url
- Ability to automatically trim whitespace from generated signature

## Installation
You can install the latest release using npm:
```bash
npm install react-another-signature-pad
```

## Usage
``` javascript
import Signature from 'react-another-signature-pad';

const style = { width: 200, height: 100 };

...

<Signature style={style} />
```

### Properties
All the options for customizing Signature Pad are available as props
<dl>
<dt>dotSize</dt>
<dd>(float or function) Radius of a single dot.</dd>
<dt>minWidth</dt>
<dd>(float) Minimum width of a line. Defaults to <code>0.5</code>.</dd>
<dt>maxWidth</dt>
<dd>(float) Maximum width of a line. Defaults to <code>2.5</code>.</dd>
<dt>throttle</dt>
<dd>(integer) Draw the next point at most once per every <code>x</code> milliseconds. Set it to <code>0</code> to turn off throttling. Defaults to <code>16</code>.</dd>
<dt>backgroundColor</dt>
<dd>(string) Color used to clear the background. Can be any color format accepted by <code>context.fillStyle</code>. Defaults to <code>"rgba(0,0,0,0)"</code> (transparent black). Use a non-transparent color e.g. <code>"rgb(255,255,255)"</code> (opaque white) if you'd like to save signatures as JPEG images.</dd>
<dt>penColor</dt>
<dd>(string) Color used to draw the lines. Can be any color format accepted by <code>context.fillStyle</code>. Defaults to <code>"black"</code>.</dd>
<dt>velocityFilterWeight</dt>
<dd>(float) Weight used to modify new velocity based on the previous velocity. Defaults to <code>0.7</code>.</dd>
<dt>onBegin</dt>
<dd>(function) Callback when stroke begin.</dd>
<dt>onEnd</dt>
<dd>(function) Callback when stroke end.</dd>
</dl>
<p>Additionally the following properties are available:</p>
<dl>
<dt>style</dt>
<dd>(object) Style to pass to the canvas element. Define custom height and width here (default to 100% if not specified).</dd>
<dt>className</dt>
<dd>(string) Class name to pass to canvas element</dd>
<dt>mimeType</dt>
<dd>(string) File type returned. Defaults to <code>image/png</code></dd>
<dt>quality</dt>
<dd>(float) Quality of image if mimeType is <code>image/jpeg</code>. Defaults to <code>1.0</code>.</dd>
<dt>blob</dt>
<dd>(bool) Set to <code>true</code> to return blob instead of data URL. Defaults to <code>false</code>.</dd>
<dt>trim</dt>
<dd>(bool) Set to <code>true</code> to trim whitespace from canvas. Defaults to <code>false</code>.</dd>
<dt>clear</dt>
<dd>(bool) Every time this prop is set to <code>true</code>, the canvas is cleared, even if it was already true.</dd>
<dt>onChange</dt>
<dd>(function) Function called every time the canvas changes. It's passed a single boolean that indicates if the canvas 
is empty.</dd>
</dl>

### Capturing canvas data
Every time the user finishes drawing on the canvas, the `onEnd` function is called. This function is passed a single 
parameter. By default, this will be the data URL of the canvas. It will, however, return a Blob of the data instead if 
the `blob` param is set to `true`. To capture the data, just create a handler like:
```javascript
handleSignatureChange(data){
  this.setState({ signature: data });
}
```
Then use it as the `onEnd` function like this:
```javascript
<Signature onEnd={this.handleSignatureChange} />
```