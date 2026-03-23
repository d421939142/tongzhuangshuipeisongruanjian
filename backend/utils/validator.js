/**
 * 验证工具类
 */

class Validator {
  /**
   * 验证必填字段
   */
  static required(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      throw new Error(`${fieldName}不能为空`);
    }
  }

  /**
   * 验证手机号
   */
  static phone(value, fieldName = '手机号') {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (value && !phoneRegex.test(value)) {
      throw new Error(`${fieldName}格式不正确`);
    }
  }

  /**
   * 验证数字
   */
  static number(value, fieldName, min = null, max = null) {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error(`${fieldName}必须是数字`);
    }
    if (min !== null && num < min) {
      throw new Error(`${fieldName}不能小于${min}`);
    }
    if (max !== null && num > max) {
      throw new Error(`${fieldName}不能大于${max}`);
    }
  }

  /**
   * 验证字符串长度
   */
  static length(value, fieldName, min = null, max = null) {
    const str = String(value);
    if (min !== null && str.length < min) {
      throw new Error(`${fieldName}长度不能少于${min}个字符`);
    }
    if (max !== null && str.length > max) {
      throw new Error(`${fieldName}长度不能超过${max}个字符`);
    }
  }

  /**
   * 验证枚举值
   */
  static enum(value, fieldName, allowedValues) {
    if (!allowedValues.includes(value)) {
      throw new Error(`${fieldName}必须是以下值之一: ${allowedValues.join(', ')}`);
    }
  }

  /**
   * 验证数组
   */
  static array(value, fieldName) {
    if (!Array.isArray(value)) {
      throw new Error(`${fieldName}必须是数组`);
    }
  }

  /**
   * 验证对象
   */
  static object(value, fieldName) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error(`${fieldName}必须是对象`);
    }
  }
}

module.exports = Validator;
