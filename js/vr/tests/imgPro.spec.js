/*
 * @Author:
 * @Date: 2024-09-24 10:45:29
 * @LastEditTime: 2024-09-24 17:21:51
 * @LastEditors: ssy
 * @Description:
 */
import IMGPRO from "../imgpro.js";

describe("3dimgPro", () => {
  test("removeBed", () => {
    let size = [512, 512, 30];
    let index = [10, 10, 10];
    let neighbor = IMGPRO.get26Neighbor(
      index[0],
      index[1],
      index[2],
      size[0],
      size[1],
      size[2],
    );
    console.log("neighbor:", neighbor.length);
    expect(neighbor.length).toBe(26);
  });
});
