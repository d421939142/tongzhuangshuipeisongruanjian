/**
 * 统一响应格式
 */
class Response {
  /**
   * 成功响应
   */
  static success(res, data = null, message = '操作成功') {
    return res.json({
      success: true,
      message,
      code: 200,
      data
    });
  }

  /**
   * 创建成功响应
   */
  static created(res, data = null, message = '创建成功') {
    return res.status(201).json({
      success: true,
      message,
      code: 201,
      data
    });
  }

  /**
   * 错误响应
   */
  static error(res, message = '操作失败', code = 400, data = null) {
    return res.status(code).json({
      success: false,
      message,
      code,
      data
    });
  }

  /**
   * 未找到响应
   */
  static notFound(res, message = '资源未找到') {
    return res.status(404).json({
      success: false,
      message,
      code: 404,
      data: null
    });
  }

  /**
   * 未授权响应
   */
  static unauthorized(res, message = '未授权访问') {
    return res.status(401).json({
      success: false,
      message,
      code: 401,
      data: null
    });
  }

  /**
   * 禁止访问响应
   */
  static forbidden(res, message = '禁止访问') {
    return res.status(403).json({
      success: false,
      message,
      code: 403,
      data: null
    });
  }

  /**
   * 服务器错误响应
   */
  static serverError(res, message = '服务器内部错误') {
    return res.status(500).json({
      success: false,
      message,
      code: 500,
      data: null
    });
  }
}

module.exports = Response;
