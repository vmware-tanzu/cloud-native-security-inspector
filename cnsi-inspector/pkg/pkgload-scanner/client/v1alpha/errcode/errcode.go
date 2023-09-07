package errcode

import "errors"

var ErrInvalidImageName = errors.New("invalid image name")
var ErrUnknownJobID = errors.New("unknown job id")
var ErrScanFailed = errors.New("scan failed")
var ErrUnknown = errors.New("unknown error")

var MapErr2Code = map[error]int{
	ErrInvalidImageName: 1,
	ErrUnknownJobID:     2,
	ErrScanFailed:       3,
	ErrUnknown:          4,
}

var MapCode2Err = map[int]error{
	1: ErrInvalidImageName,
	2: ErrUnknownJobID,
	3: ErrScanFailed,
	4: ErrUnknown,
}

func GetCode(err error) int {
	if code, ok := MapErr2Code[err]; ok {
		return code
	}
	return 0
}

func GetErr(code int) error {
	if err, ok := MapCode2Err[code]; ok {
		return err
	}
	return ErrUnknown
}
