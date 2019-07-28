### Server ###
FROM golang:alpine
RUN apk add --no-cache git

# Dependencies
WORKDIR /go/

# Go build
ADD *.go ./
RUN go build -o app

ADD static/ static/

COPY dump/ dump/

CMD ["./app"]

EXPOSE 8080