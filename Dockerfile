### Server ###
FROM golang:alpine
RUN apk add --no-cache git

# Dependencies
RUN go get github.com/mongodb/mongo-go-driver/mongo
WORKDIR /go/

# Go build
ADD app.go .
RUN go build -o app

ADD static/ static/

COPY dump/ dump/

CMD ["./app"]

EXPOSE 8080