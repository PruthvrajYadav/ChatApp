# १. Node.js इमेज वापरणे
FROM node:18-alpine

# २. वर्किंग डिरेक्टरी सेट करणे
WORKDIR /app

# ३. package.json फाईल्स कॉपी करणे
COPY package*.json ./

# ४. डिपेंडन्सीज इन्स्टॉल करणे
RUN npm install

# ५. सर्व कोड कॉपी करणे
COPY . .

# ६. पोर्ट एक्स्पोज करणे (Render साठी)
EXPOSE 5001

# ७. ॲप सुरू करणे
CMD ["npm", "start"]
