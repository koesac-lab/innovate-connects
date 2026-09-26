FROM python:3.12-alpine AS builder
WORKDIR /site
COPY docs/ docs/
COPY public/ public/
COPY tools/build_pages.py tools/build_pages.py
RUN python3 tools/build_pages.py

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /site/_site/concept-two/ /usr/share/nginx/html/
EXPOSE 80
