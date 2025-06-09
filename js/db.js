import Dexie from "dexie";
import moment from "moment";

let db = null;

export default {
  async init() {
    db = new Dexie("imageDB");
    db.version(30).stores({
      imgPoor: "++id, seriesId, data, date",
    });
  },
  async add(seriesId, imageDatas) {
    const exist = await this.get(seriesId);
    console.log(exist, seriesId, "get series");
    if (exist) return;
    try {
      // 不需要作为key的数据，最好保存在对象当中，不然可能无法存进DB中
      return db.imgPoor.add({
        seriesId,
        data: {
          imageDatas,
          // volumeBuffer,
        },
        date: moment().format("yyyy-MM-DD"),
      });
    } catch (error) {
      console.log(error, "add error");
    }
  },
  async get(seriesId) {
    return db.imgPoor.get({ seriesId });
  },
  async dropDB() {
    return db.imgPoor.clear();
  },
  async getCount() {
    return db.imgPoor.count();
  },
  async deleteOne(seriesId) {
    return db.imgPoor.where({ seriesId }).delete(seriesId);
  },
  async getWhereCount(seriesId) {
    return await db.imgPoor.where({ seriesId }).count();
  },
  // 只保留当天的缓存数据
  async autoClean() {
    return db.imgPoor
      .where("date")
      .notEqual(moment().format("yyyy-MM-DD"))
      .limit(1)
      .delete()
      .then((res) => {
        console.log(res, "autoClean");
        if (res) this.autoClean();
      });
  },
};
