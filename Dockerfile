FROM node:18-alpine
WORKDIR /app
COPY . .
# 数据文件和配置由挂载卷或环境变量提供
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
