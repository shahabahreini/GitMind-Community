// Audio/video bodies must never enter AI change context, even when Git treats them as text.
export const MEDIA_FILE = /\.(?:3g2|aifc|amr|ape|asf|au|avchd|caf|divx|m2ts|m2v|m4b|m4p|mka|mp2|mpe|mpv|mxf|ogv|ogx|qt|ra|rm|rmvb|vob|weba|wv|aac|aiff?|flac|m4a|mid|midi|mp3|oga|ogg|opus|wav|wma|3gp|avi|flv|m4v|mkv|mov|mp4|mpeg|mpg|mts|webm|wmv)$/i;
