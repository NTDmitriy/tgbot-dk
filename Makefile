build:
		docker build -t dkbotgpt .

run:
		docker run -d -p 3000:3000 --name dkbotgpt --rm dkbotgpt