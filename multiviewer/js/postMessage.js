/**
 * postMessage 消息生成器
 */
export class PostMessageCreator {

	constructor(key = "", message = null) {
		this.key = key;
		this.message = message;
	}

	static create(key, message) {
		if (!key || !message) {
			throw TypeError("请检查传递postMessage的key和message字段")
		}
		return new PostMessageCreator(key, message)
	}

	/**
	 * 发送arrayBuffer二进制事件
	 * @param arrayBuffer
	 */
	static sendScreenshotEvent(arrayBuffer) {
		if (window.parent === window) {
			console.warn("当前环境不在父子页面中，终止发送postMessage消息");
			return;
		}

		const data = PostMessageCreator.create("screenshot", arrayBuffer)
		window.parent.postMessage(data, "*");
	}
}
