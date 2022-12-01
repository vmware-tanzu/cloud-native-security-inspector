package riskmanager

import "os"

type Config struct {
	Server      string `json:"server"`
	DetailIndex string `json:"detail_index"`
	StandAlone  bool   `json:"standalone"`
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
		Server:      "localhost:8080",
		DetailIndex: "risk_manager_details",
		StandAlone:  true,
	}
}

// ReadEnvConfig read configuration from env
func ReadEnvConfig() *Config {
	return &Config{
		Server:      getEnv("SERVER_ADDR", "localhost:8080"),
		DetailIndex: getEnv("DETAIL_INDEX", "risk_manager_details"),
		StandAlone:  getEnv("STANDALONE", "false") == "true",
	}
}
