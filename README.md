# Tenancy proxy
Server providing multi tenancy facade for Netflix Conductor.

## Building
```
npm install
```
## Running
```
npm start
```

## Testing

### Integration tests
```
npm run integration
```


### End 2 end tests
You need to run Conductor locally. The easiest 
way to get Conductor up and running quickly is using
docker-compose like this:
```
git clone https://github.com/Netflix/conductor.git
cd conductor/docker
docker-compose build
docker-compose up -d
```
When conductor is running execute the following command:

```
npm run e2e
```

## TODOs
* handle connection issues, exceptions
* Forwarded response headers are in lower case:
```
> GET /api/metadata/workflow HTTP/1.1
> Host: localhost:8081
> User-Agent: curl/7.47.0
> Accept: */*
> x-auth-organization: FB
>
< HTTP/1.1 200 OK
< X-Powered-By: Express
< date: Tue, 07 Apr 2020 09:54:47 GMT
< access-control-allow-origin: *
< access-control-allow-methods: GET, POST, DELETE, PUT
< access-control-allow-headers: Content-Type, api_key, Authorization
< content-type: application/json
< connection: close
< server: Jetty(9.3.z-SNAPSHOT)
< Transfer-Encoding: chunked
```
