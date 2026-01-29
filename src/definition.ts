import {
  defineWidget,
  param,
  folder,
  when,
  type ExtractParams,
  type ExtractAnswer,
} from "@joymath/widget-sdk";

// Widget definition
export const widgetDefinition = defineWidget({
  // Parameters - config từ giáo viên
  parameters: {
    question: param.string("Sắp xếp các số theo thứ tự").label("Câu hỏi"),

    numbers: param
      .string("5, 2, 8, 1, 9, 3")
      .label("Các số")
      .description("Nhập các số cách nhau bởi dấu phẩy"),

    orderType: param
      .select(["Tăng dần", "Giảm dần"], "Tăng dần")
      .label("Kiểu sắp xếp"),

    settings: folder("Cài đặt", {
      showFeedback: param.boolean(true).label("Hiển thị phản hồi"),
      feedbackCorrect: param
        .string("Tuyệt vời! Bé đã sắp xếp đúng rồi!")
        .label("Phản hồi khi đúng")
        .visibleIf(when("settings.showFeedback").equals(true)),
      feedbackIncorrect: param
        .string("Chưa đúng rồi, bé thử lại nhé!")
        .label("Phản hồi khi sai")
        .visibleIf(when("settings.showFeedback").equals(true)),
    }).expanded(false),
  },

  // Answer schema
  answer: {
    sortedNumbers: param.string("[]").label("Thứ tự các số (JSON)"),
    // Format: [5, 2, 8, 1, 9, 3] - thứ tự sau khi sắp xếp
    initialOrder: param.string("[]").label("Thứ tự ban đầu (JSON)"),
    // Format: [2, 0, 3, 1, 4, 5] - thứ tự xáo trộn ban đầu (indices)
  },
} as const);

// Type inference
export type WidgetParams = ExtractParams<typeof widgetDefinition>;
export type WidgetAnswer = ExtractAnswer<typeof widgetDefinition>;
