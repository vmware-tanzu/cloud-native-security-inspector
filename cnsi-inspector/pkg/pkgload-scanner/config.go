package pkgload_scanner

import "os"

type Config struct {
	Server     string `json:"server"`
	StandAlone bool   `json:"standalone"`
}

// getEnv get key environment variable if exist otherwise return defalutValue
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if len(value) == 0 {
		return defaultValue
	}
	return value
}

// DefaultConfig read configuration from env
func DefaultConfig() *Config {
	return &Config{
		Server:     "localhost:8080",
		StandAlone: true,
	}
}

// ReadEnvConfig read configuration from env
func ReadEnvConfig() *Config {
	return &Config{
		Server:     getEnv("SERVER_ADDR", "localhost:8080"),
		StandAlone: getEnv("STANDALONE", "false") == "true",
	}
}
